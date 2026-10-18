import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config';
import { STAGE_NAMES, StageNumber, StageName } from '../types';

// =====================================================
// LLM Service - Gemini Integration
// =====================================================

// Lazy-initialized Gemini client
let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  }
  return genAI;
}

// Reset client (for testing purposes)
export function resetGeminiClient(): void {
  genAI = null;
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

export interface CallIntelligence {
  overallSentiment: 'positive' | 'neutral' | 'negative';
  keyTopics: string[];
  prospectInterestLevel: 'high' | 'medium' | 'low';
  recommendedNextActions: string[];
  conversationSummary: string;
}

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
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: config.gemini.model });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    // Handle specific Gemini API errors
    if (error.message?.includes('quota')) {
      throw new Error('Gemini API quota exceeded. Please try again later.');
    }
    if (error.message?.includes('rate limit')) {
      throw new Error('Gemini API rate limit reached. Please wait and retry.');
    }
    if (error.message?.includes('API key')) {
      throw new Error('Invalid Gemini API key. Please check your configuration.');
    }
    throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
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
  currentStage: StageNumber
): Promise<AnalysisResult> {
  const stageContext = buildStageContext();
  
  const prompt = `
${stageContext}

You are analyzing a cold call transcript. The caller is currently in stage ${currentStage} (${STAGE_NAMES[currentStage]}).

Transcript chunk:
"${transcriptChunk}"

Analyze this transcript and respond with a JSON object containing:
- detectedStage: number (1-8) - which stage does this conversation reflect?
- keyPhrases: array of important phrases or words said
- sentiment: "positive", "neutral", or "negative"
- summary: brief summary of what was discussed

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
  currentStage: StageName
): Promise<SuggestedResponse> {
  const stageContext = buildStageContext();
  const conversationHistory = getConversationContext(callId);
  const historyText = conversationHistory.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n');
  
  const prompt = `
${stageContext}

Current stage: ${currentStage}

Recent conversation history:
${historyText}

The prospect just said:
"${prospectLastWords}"

Suggest 3 professional and appropriate responses the sales caller could use.

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
  const conversationHistory = getConversationContext(callId);
  
  if (conversationHistory.length === 0) {
    return {
      overallSentiment: 'neutral',
      keyTopics: [],
      prospectInterestLevel: 'low',
      recommendedNextActions: ['Start the conversation'],
      conversationSummary: 'No conversation recorded yet.',
    };
  }
  
  const historyText = conversationHistory.map(m => `${m.role}: ${m.text}`).join('\n');
  
  const prompt = `
Analyze this complete cold call conversation and provide intelligence insights:

${historyText}

Respond with a JSON object containing:
- overallSentiment: "positive", "neutral", or "negative"
- keyTopics: array of main topics discussed
- prospectInterestLevel: "high", "medium", or "low"
- recommendedNextActions: array of suggested next steps
- conversationSummary: brief summary of the entire conversation

Respond ONLY with valid JSON, no markdown formatting.
`;

  const response = await callGemini(prompt);
  
  try {
    const parsed = JSON.parse(response.trim());
    return {
      overallSentiment: parsed.overallSentiment || 'neutral',
      keyTopics: parsed.keyTopics || [],
      prospectInterestLevel: parsed.prospectInterestLevel || 'low',
      recommendedNextActions: parsed.recommendedNextActions || [],
      conversationSummary: parsed.conversationSummary || '',
    };
  } catch (error) {
    throw new Error('Failed to parse Gemini response for call intelligence');
  }
}

/**
 * Clear conversation context for a call (e.g., when call is closed)
 */
export function clearConversationContext(callId: string): void {
  conversationContexts.delete(callId);
}
