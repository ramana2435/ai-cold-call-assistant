// Using native fetch() for Gemini API calls instead of SDK
// This avoids compatibility issues with @google/generative-ai in Windows/Node environments
import config from '../config';
import { STAGE_NAMES, StageNumber, StageName } from '../types';
import { getRelevantExamples, ReferenceIntelligence } from './referenceIntelligenceService';

// =====================================================
// LLM Service - Gemini Integration
// =====================================================

// Type for Gemini API response
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface GeminiErrorResponse {
  error?: {
    message?: string;
    code?: number;
    status?: string;
  };
}

// In-memory conversation context storage
interface ConversationMessage {
  role: 'user' | 'model';
  text: string;
}

const conversationContexts = new Map<string, ConversationMessage[]>();

// =====================================================
// Type Definitions for LLM Responses
// =====================================================

export interface AnalysisResult {
  detectedStage: StageNumber;
  detectedStageName: StageName;
  keyPhrases: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
}

export interface StageRecommendation {
  recommendedStage: StageNumber;
  recommendedStageName: StageName;
  confidence: number; // 0-1
  reasoning: string;
}

export interface SuggestedResponse {
  responses: string[];
}

export interface SuggestedResponseItem {
  text: string;
  explanation: string;
}

export interface SuggestedResponseEnhanced {
  primary: SuggestedResponseItem;
  alternatives: SuggestedResponseItem[];
  referenceIntelligence: ReferenceIntelligence;
}

// Import CallIntelligence from shared types
import type { CallIntelligence } from '../types';

// =====================================================
// Helper Functions
// =====================================================

function getConversationContext(callId: string): ConversationMessage[] {
  if (!conversationContexts.has(callId)) {
    conversationContexts.set(callId, []);
  }
  return conversationContexts.get(callId)!;
}

function addToConversationContext(callId: string, role: 'user' | 'model', text: string): void {
  const context = getConversationContext(callId);
  context.push({ role, text });
}

/**
 * Build context from product and organization knowledge
 */
function buildKnowledgeContext(
  productProfile?: any,
  organizationProfile?: any
): string {
  let context = '';

  if (productProfile) {
    context += '\n\n=== PRODUCT KNOWLEDGE ===\n';
    context += `Product: ${productProfile.product_name}\n`;
    
    if (productProfile.short_description) {
      context += `\nDescription: ${productProfile.short_description}\n`;
    }
    
    if (productProfile.problems_solved && productProfile.problems_solved.length > 0) {
      context += `\nProblems Solved:\n`;
      productProfile.problems_solved.forEach((problem: string) => {
        context += `- ${problem}\n`;
      });
    }
    
    if (productProfile.benefits && productProfile.benefits.length > 0) {
      context += `\nBenefits:\n`;
      productProfile.benefits.forEach((benefit: string) => {
        context += `- ${benefit}\n`;
      });
    }
    
    if (productProfile.features && productProfile.features.length > 0) {
      context += `\nKey Features:\n`;
      productProfile.features.forEach((feature: any) => {
        context += `- ${feature.name}: ${feature.description}\n`;
      });
    }
    
    if (productProfile.pricing_model) {
      context += `\nPricing: ${productProfile.pricing_model}\n`;
    }
    
    if (productProfile.product_limitations) {
      context += `\nIMPORTANT - Product Limitations: ${productProfile.product_limitations}\n`;
      context += `DO NOT suggest features or capabilities outside these limitations.\n`;
    }
    
    if (productProfile.ideal_customer_profile) {
      context += `\nIdeal Customer: ${productProfile.ideal_customer_profile}\n`;
    }
    
    if (productProfile.preferred_next_steps) {
      context += `\nRecommended Next Steps: ${productProfile.preferred_next_steps}\n`;
    }
  }

  if (organizationProfile) {
    context += '\n\n=== TARGET ORGANIZATION ===\n';
    context += `Organization: ${organizationProfile.organization_name}\n`;
    
    if (organizationProfile.industry) {
      context += `Industry: ${organizationProfile.industry}\n`;
    }
    
    if (organizationProfile.organization_type) {
      context += `Type: ${organizationProfile.organization_type}\n`;
    }
    
    if (organizationProfile.prospect_name) {
      context += `\nContact: ${organizationProfile.prospect_name}`;
      if (organizationProfile.prospect_role) {
        context += ` (${organizationProfile.prospect_role})`;
      }
      if (organizationProfile.is_decision_maker === true) {
        context += ` [Decision Maker]`;
      } else if (organizationProfile.is_decision_maker === false) {
        context += ` [Not Decision Maker]`;
      }
      context += `\n`;
    }
    
    if (organizationProfile.business_challenges) {
      context += `\nKnown Challenges: ${organizationProfile.business_challenges}\n`;
    }
    
    if (organizationProfile.potential_use_cases) {
      context += `\nPotential Use Cases: ${organizationProfile.potential_use_cases}\n`;
    }
    
    if (organizationProfile.organization_notes) {
      context += `\nAdditional Notes: ${organizationProfile.organization_notes}\n`;
    }
    
    if (organizationProfile.confidence_level && organizationProfile.confidence_level !== 'high') {
      context += `\nData Confidence: ${organizationProfile.confidence_level} - verify assumptions during call\n`;
    }
  }

  if (!productProfile && !organizationProfile) {
    context += '\n\n=== NO PRODUCT OR ORGANIZATION KNOWLEDGE ===\n';
    context += 'No specific product or organization profiles are associated with this call.\n';
    context += 'Provide general guidance based on the conversation only.\n';
  }

  return context;
}

/**
 * Build stage context string
 */
function buildStageContext(): string {
  return `
The 8 official cold-call stages are:
1. ${STAGE_NAMES[1]} - Initial greeting and introduction
2. ${STAGE_NAMES[2]} - Explain why you're calling
3. ${STAGE_NAMES[3]} - Ask if they have time to talk
4. ${STAGE_NAMES[4]} - Learn about their business
5. ${STAGE_NAMES[5]} - Understand their needs in their own words
6. ${STAGE_NAMES[6]} - Address concerns or objections
7. ${STAGE_NAMES[7]} - Agree on next steps
8. ${STAGE_NAMES[8]} - End the call professionally
`.trim();
}

async function callGemini(prompt: string): Promise<string> {
  try {
    // Use Node's https module with proper certificate handling
    // This avoids certificate verification issues in Windows environments
    const https = await import('https');
    const { URL } = await import('url');
    
    const apiUrl = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`);
    
    const requestBody = JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    });
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: apiUrl.hostname,
        port: 443,
        path: apiUrl.pathname + apiUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody)
        },
        timeout: 30000,
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data) as GeminiResponse | GeminiErrorResponse;
            
            // Check for API errors
            if ('error' in parsed && parsed.error) {
              const errorStatus = parsed.error.code || res.statusCode;
              const errorMessage = parsed.error.message || 'Unknown error';
              
              if (errorStatus === 401) {
                reject(new Error('Authentication failed. Verify GEMINI_API_KEY in backend .env is correct and not expired.'));
                return;
              }
              if (errorStatus === 404) {
                reject(new Error(`Model "${config.gemini.model}" not available. Current supported model: gemini-3.5-flash (Gemini 1.5/2.0 models deprecated).`));
                return;
              }
              if (errorStatus === 403) {
                reject(new Error('Permission denied. Your API key may lack access to this model. Check API restrictions in AI Studio.'));
                return;
              }
              if (errorStatus === 429) {
                reject(new Error('Gemini API quota exceeded or rate limit reached. Please wait and try again.'));
                return;
              }
              
              reject(new Error(`Gemini API error (${errorStatus}): ${errorMessage}`));
              return;
            }
            
            // Extract successful response
            const response = parsed as GeminiResponse;
            if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
              resolve(response.candidates[0].content.parts[0].text);
            } else {
              reject(new Error('Unexpected response format from Gemini API'));
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse Gemini response: ${parseError}`));
          }
        });
      });
      
      req.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'ECONNREFUSED') {
          reject(new Error('Network error: Connection refused. Check your internet connection.'));
        } else if (error.code === 'ETIMEDOUT') {
          reject(new Error('Network error: Request timeout. Check your internet connection.'));
        } else if (error.code === 'ENOTFOUND') {
          reject(new Error('Network error: DNS resolution failed. Check your internet connection.'));
        } else if (error.message?.includes('certificate')) {
          reject(new Error('TLS error: Certificate verification failed. This is a Windows certificate store issue, but the request may still succeed.'));
        } else {
          reject(new Error(`Network error: ${error.message}`));
        }
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout (30s). Check your internet connection.'));
      });
      
      req.write(requestBody);
      req.end();
    });
    
  } catch (error: any) {
    // If it's already our formatted error, re-throw it
    if (error.message?.startsWith('Authentication failed') ||
        error.message?.startsWith('Model ') ||
        error.message?.startsWith('Permission denied') ||
        error.message?.startsWith('Gemini API')) {
      throw error;
    }
    
    // Generic error
    throw new Error(`Gemini API error: ${error.message || 'Unknown error occurred'}`);
  }
}

// =====================================================
// Core LLM Functions
// =====================================================

/**
 * Analyze a transcript chunk and detect the current stage
 */
export async function analyzeTranscript(
  callId: string,
  transcriptChunk: string,
  currentStage: StageNumber,
  knowledgeContext?: { product?: any; organization?: any }
): Promise<AnalysisResult> {
  const stageContext = buildStageContext();
  const productOrgContext = knowledgeContext 
    ? buildKnowledgeContext(knowledgeContext.product, knowledgeContext.organization)
    : '';
  
  const prompt = `
${stageContext}
${productOrgContext}

You are analyzing a cold call transcript. The caller is currently in stage ${currentStage} (${STAGE_NAMES[currentStage]}).

Transcript chunk:
"${transcriptChunk}"

Analyze this transcript and respond with a JSON object containing:
- detectedStage: number (1-8) - which stage does this conversation reflect?
- keyPhrases: array of important phrases or words said
- sentiment: "positive", "neutral", or "negative"
- summary: brief summary of what was discussed

${productOrgContext ? 'Consider the product and organization context when analyzing.' : ''}

Respond ONLY with valid JSON, no markdown formatting.
`;

  addToConversationContext(callId, 'user', transcriptChunk);
  
  const response = await callGemini(prompt);
  addToConversationContext(callId, 'model', response);
  
  try {
    const parsed = JSON.parse(response.trim());
    return {
      detectedStage: parsed.detectedStage as StageNumber,
      detectedStageName: STAGE_NAMES[parsed.detectedStage as StageNumber],
      keyPhrases: parsed.keyPhrases || [],
      sentiment: parsed.sentiment || 'neutral',
      summary: parsed.summary || '',
    };
  } catch (error) {
    throw new Error('Failed to parse Gemini response for transcript analysis');
  }
}

/**
 * Suggest the next stage based on conversation context
 */
export async function suggestNextStage(
  callId: string,
  currentStageNumber: StageNumber,
  conversationContext: string
): Promise<StageRecommendation> {
  const stageContext = buildStageContext();
  const conversationHistory = getConversationContext(callId);
  const historyText = conversationHistory.length > 0 
    ? conversationHistory.slice(-3).map(m => `${m.role}: ${m.text}`).join('\n')
    : '';
  
  const prompt = `
${stageContext}

The caller is currently in stage ${currentStageNumber} (${STAGE_NAMES[currentStageNumber]}).

${historyText ? `Previous conversation:\n${historyText}\n\n` : ''}Recent conversation:
"${conversationContext}"

Based on the conversation flow, what stage should the caller move to next?

Respond with a JSON object containing:
- recommendedStage: number (1-8)
- confidence: number between 0 and 1
- reasoning: brief explanation

Respond ONLY with valid JSON, no markdown formatting.
`;

  const response = await callGemini(prompt);
  
  try {
    const parsed = JSON.parse(response.trim());
    return {
      recommendedStage: parsed.recommendedStage as StageNumber,
      recommendedStageName: STAGE_NAMES[parsed.recommendedStage as StageNumber],
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || '',
    };
  } catch (error) {
    throw new Error('Failed to parse Gemini response for stage recommendation');
  }
}

/**
 * Suggest responses based on prospect's last words
 */
export async function suggestResponse(
  callId: string,
  prospectLastWords: string,
  currentStage: StageName,
  knowledgeContext?: { product?: any; organization?: any }
): Promise<SuggestedResponse> {
  const stageContext = buildStageContext();
  const conversationHistory = getConversationContext(callId);
  const historyText = conversationHistory.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n');
  const productOrgContext = knowledgeContext 
    ? buildKnowledgeContext(knowledgeContext.product, knowledgeContext.organization)
    : '';
  
  const prompt = `
${stageContext}
${productOrgContext}

Current stage: ${currentStage}

Recent conversation history:
${historyText}

The prospect just said:
"${prospectLastWords}"

Suggest 3 professional and appropriate responses the sales caller could use.
${productOrgContext ? 'Base your suggestions on the product benefits and organization context provided.' : ''}
${productOrgContext ? 'DO NOT suggest features or promises not supported by the product information.' : ''}

Respond with a JSON object containing:
- responses: array of 3 suggested response strings

Respond ONLY with valid JSON, no markdown formatting.
`;

  addToConversationContext(callId, 'user', prospectLastWords);
  
  const response = await callGemini(prompt);
  addToConversationContext(callId, 'model', response);
  
  try {
    const parsed = JSON.parse(response.trim());
    return {
      responses: parsed.responses || [],
    };
  } catch (error) {
    throw new Error('Failed to parse Gemini response for response suggestions');
  }
}

/**
 * Generate call intelligence summary
 */
export async function getCallIntelligence(callId: string): Promise<CallIntelligence> {
  try {
    // Import callService to get stage data
    const { getCallWithStages } = require('./callService');
    
    // Get call with stage progression
    const callWithStages = await getCallWithStages(callId);
    
    if (!callWithStages) {
      throw new Error('Call not found');
    }
    
    // Build stage progression from actual stage results
    const stageProgression = callWithStages.stage_results.map((stage: any) => ({
      stage: stage.stage_number,
      duration: undefined, // We don't track duration yet
    }));
    
    const conversationHistory = getConversationContext(callId);
    
    // If no conversation history, return basic intelligence from stage data
    if (conversationHistory.length === 0) {
      console.log(`[Intelligence] No conversation history for call ${callId}, returning basic intelligence`);
      return {
        callId,
        stageProgression,
        overallSentiment: 'neutral',
        criticalPhrases: [],
        recommendedActions: stageProgression.length === 0 
          ? ['Start the conversation']
          : ['Continue to next stage'],
        confidenceScore: 0.5,
      };
    }
    
    const historyText = conversationHistory.map(m => `${m.role}: ${m.text}`).join('\n');
    
    // Collect prospect words from stage results for analysis
    const prospectWords = callWithStages.stage_results
      .filter((stage: any) => stage.prospect_words)
      .map((stage: any) => stage.prospect_words)
      .join(' ');
    
    const prompt = `
Analyze this complete cold call conversation and provide intelligence insights:

Conversation History:
${historyText}

Key Prospect Quotes:
${prospectWords || 'None recorded'}

Respond with a JSON object containing:
- overallSentiment: "positive", "neutral", or "negative"
- criticalPhrases: array of most important phrases or topics discussed (max 5)
- recommendedActions: array of suggested next steps (max 4)
- confidenceScore: number between 0 and 1 indicating analysis confidence

Respond ONLY with valid JSON, no markdown formatting.
`;

    const response = await callGemini(prompt);
    
    try {
      const parsed = JSON.parse(response.trim());
      const result = {
        callId,
        stageProgression,
        overallSentiment: parsed.overallSentiment || 'neutral',
        criticalPhrases: Array.isArray(parsed.criticalPhrases) ? parsed.criticalPhrases : [],
        recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
        confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.5,
      };
      console.log(`[Intelligence] Successfully generated intelligence for call ${callId}`);
      return result;
    } catch (parseError) {
      console.error('[Intelligence] Failed to parse Gemini response:', parseError);
      console.error('[Intelligence] Raw response:', response);
      throw new Error('Failed to parse Gemini response for call intelligence');
    }
  } catch (error) {
    console.error(`[Intelligence] Error generating intelligence for call ${callId}:`, error);
    throw error;
  }
}

/**
 * Get reference-enhanced suggestions using real call examples
 */
export async function suggestResponseWithReferences(
  callId: string,
  prospectLastWords: string,
  currentStage: StageName,
  recentTranscript: string,
  knowledgeContext?: { product?: any; organization?: any }
): Promise<SuggestedResponseEnhanced> {
  // Get relevant reference examples
  const refIntel = await getRelevantExamples(currentStage, recentTranscript);
  
  // Build context with reference examples
  const stageContext = buildStageContext();
  const conversationHistory = getConversationContext(callId);
  const historyText = conversationHistory.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n');
  const productOrgContext = knowledgeContext 
    ? buildKnowledgeContext(knowledgeContext.product, knowledgeContext.organization)
    : '';

  // Build reference examples context (without exposing full transcripts)
  let referenceContext = '';
  if (refIntel.examples.length > 0) {
    referenceContext = '\n\nREFERENCE EXAMPLES FROM REAL CALLS:\n';
    referenceContext += refIntel.guidance + '\n\n';
    
    for (const example of refIntel.examples) {
      referenceContext += `Example (Outcome: ${example.outcome}, ${example.metadata.company_kind}):\n`;
      referenceContext += example.excerpt + '\n\n';
    }
    
    referenceContext += 'USE THESE AS INSPIRATION FOR TONE AND APPROACH, NOT AS SCRIPTS TO COPY.\n';
  }

  // Use provided prospectLastWords or fallback to recent transcript context
  const contextToUse = prospectLastWords.trim() || recentTranscript || 'Recent conversation context';

  const prompt = `
${stageContext}
${productOrgContext}
${referenceContext}

Current stage: ${currentStage}

Recent conversation history:
${historyText}

The prospect just said:
"${contextToUse}"

Generate ONE recommended response and TWO alternative responses, each with an explanation of why it fits the situation.
${referenceContext ? 'Learn from the reference examples but adapt to THIS specific conversation.' : ''}
${productOrgContext ? 'Base suggestions on actual product benefits. DO NOT invent features.' : ''}

CRITICAL RULES:
- If prospect says "do not call" or similar, suggest acknowledging and ending the call respectfully.
- Do not suggest continuing sales pressure after an explicit refusal.
- Do not fabricate product features, prices, or customer results.
- Keep responses natural and conversational, not scripted.

Respond with a JSON object in this exact format:
{
  "primary": {
    "text": "The recommended response text",
    "explanation": "Why this response is best for the situation"
  },
  "alternatives": [
    {
      "text": "First alternative response",
      "explanation": "Why this alternative also works"
    },
    {
      "text": "Second alternative response",
      "explanation": "Why this alternative could be useful"
    }
  ]
}

Respond ONLY with valid JSON, no markdown.
`;

  addToConversationContext(callId, 'user', contextToUse);
  
  const response = await callGemini(prompt);
  addToConversationContext(callId, 'model', response);
  
  try {
    const parsed = JSON.parse(response.trim());
    
    // Validate structure
    if (!parsed.primary || !parsed.primary.text || !parsed.primary.explanation) {
      throw new Error('Invalid primary response structure');
    }
    if (!Array.isArray(parsed.alternatives) || parsed.alternatives.length > 2) {
      throw new Error('Alternatives must be an array with at most 2 items');
    }
    
    return {
      primary: {
        text: parsed.primary.text,
        explanation: parsed.primary.explanation,
      },
      alternatives: parsed.alternatives.map((alt: any) => ({
        text: alt.text || '',
        explanation: alt.explanation || '',
      })),
      referenceIntelligence: refIntel,
    };
  } catch (error) {
    console.error('[LLM] Failed to parse reference-enhanced response:', error);
    throw new Error('Failed to parse AI response');
  }
}

/**
 * Clear conversation context for a call (e.g., when call is closed)
 */
export function clearConversationContext(callId: string): void {
  conversationContexts.delete(callId);
}
