// Visual Assistance Service - Context-Aware Visual Suggestions
import { StageName } from '../types';
import config from '../config/index';

// Type definitions
export interface VisualSuggestion {
  title: string;
  relevance: string;
  visualType: string;
  description: string;
}

export interface VisualContextAnalysisInput {
  callId: string;
  currentStage: StageName;
  recentTranscript: string;
  knowledgeContext?: {
    product?: any;
    organization?: any;
  };
}

// In-memory tracking of suggested visuals to avoid duplicates
const suggestionHistory = new Map<string, Set<string>>();

/**
 * Generate a hash for a suggestion to detect duplicates
 */
function generateSuggestionHash(title: string, visualType: string): string {
  return `${title.toLowerCase().trim()}_${visualType.toLowerCase().trim()}`;
}

/**
 * Check if a suggestion was already made for this call
 */
function isDuplicateSuggestion(callId: string, hash: string): boolean {
  if (!suggestionHistory.has(callId)) {
    suggestionHistory.set(callId, new Set());
  }
  const history = suggestionHistory.get(callId)!;
  return history.has(hash);
}

/**
 * Record a suggestion as made
 */
function recordSuggestion(callId: string, hash: string): void {
  if (!suggestionHistory.has(callId)) {
    suggestionHistory.set(callId, new Set());
  }
  suggestionHistory.get(callId)!.add(hash);
}

/**
 * Clear suggestion history for a call (e.g., when call is closed)
 */
export function clearSuggestionHistory(callId: string): void {
  suggestionHistory.delete(callId);
}

/**
 * Build knowledge context string for prompt
 */
function buildKnowledgeContextString(knowledgeContext?: { product?: any; organization?: any }): string {
  let context = '';

  if (knowledgeContext?.product) {
    const product = knowledgeContext.product;
    context += '\n\n=== PRODUCT INFORMATION ===\n';
    context += `Product Name: ${product.product_name}\n`;
    
    if (product.short_description) {
      context += `Description: ${product.short_description}\n`;
    }
    
    if (product.features && product.features.length > 0) {
      context += `\nKey Features:\n`;
      product.features.slice(0, 5).forEach((feature: any) => {
        context += `- ${feature.name}: ${feature.description}\n`;
      });
    }
    
    if (product.problems_solved && product.problems_solved.length > 0) {
      context += `\nProblems Solved:\n`;
      product.problems_solved.slice(0, 3).forEach((problem: string) => {
        context += `- ${problem}\n`;
      });
    }
    
    if (product.use_cases && product.use_cases.length > 0) {
      context += `\nUse Cases:\n`;
      product.use_cases.slice(0, 3).forEach((useCase: string) => {
        context += `- ${useCase}\n`;
      });
    }
  }

  if (knowledgeContext?.organization) {
    const org = knowledgeContext.organization;
    context += '\n\n=== ORGANIZATION INFORMATION ===\n';
    context += `Organization: ${org.organization_name}\n`;
    
    if (org.industry) {
      context += `Industry: ${org.industry}\n`;
    }
    
    if (org.organization_type) {
      context += `Type: ${org.organization_type}\n`;
    }
    
    if (org.business_challenges) {
      context += `Known Challenges: ${org.business_challenges}\n`;
    }
    
    if (org.potential_use_cases) {
      context += `Potential Use Cases: ${org.potential_use_cases}\n`;
    }
  }

  return context;
}

/**
 * Call Gemini API using native HTTPS (matching llmService.ts pattern)
 */
async function callGemini(prompt: string): Promise<string> {
  try {
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
            const parsed = JSON.parse(data);
            
            // Check for API errors
            if (parsed.error) {
              const errorStatus = parsed.error.code || res.statusCode;
              const errorMessage = parsed.error.message || 'Unknown error';
              
              if (errorStatus === 401) {
                reject(new Error('Authentication failed. Verify GEMINI_API_KEY in backend .env is correct and not expired.'));
                return;
              }
              if (errorStatus === 404) {
                reject(new Error(`Model "${config.gemini.model}" not available. Current supported model: gemini-3.5-flash.`));
                return;
              }
              if (errorStatus === 403) {
                reject(new Error('Permission denied. Your API key may lack access to this model.'));
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
            if (parsed.candidates && parsed.candidates[0]?.content?.parts?.[0]?.text) {
              resolve(parsed.candidates[0].content.parts[0].text);
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
    throw new Error(`Gemini API error: ${error.message || 'Unknown error occurred'}`);
  }
}

/**
 * Analyze call context and generate visual suggestions
 */
export async function analyzeVisualContext(input: VisualContextAnalysisInput): Promise<{ suggestions: VisualSuggestion[] }> {
  const { callId, currentStage, recentTranscript, knowledgeContext } = input;
  
  const knowledgeContextStr = buildKnowledgeContextString(knowledgeContext);
  
  // Build prompt for visual suggestion generation
  const prompt = `
You are a sales assistant helping a salesperson conduct a cold call. Your task is to suggest RELEVANT visual aids that would help explain the product or address the prospect's concerns.

CURRENT SALES STAGE: ${currentStage}

RECENT CONVERSATION:
${recentTranscript || 'No conversation yet - call just started'}

${knowledgeContextStr}

TASK:
Suggest 2-4 CONTEXT-SPECIFIC visual aids that would be helpful at this moment in the conversation. Each suggestion should include:
1. A descriptive title for the visual
2. An explanation of WHY this visual is relevant to the current conversation
3. The type of visual (e.g., "dashboard screenshot", "workflow diagram", "feature illustration", "comparison chart")
4. A detailed text description of what the visual would show

RULES:
- Suggestions MUST be relevant to the actual conversation and product/organization context provided
- For College ERP discussing fee management -> suggest fee dashboard illustrations
- For Hospital discussing billing -> suggest billing workflow diagrams
- For generic early-stage calls -> suggest product overview visuals or use case diagrams
- DO NOT suggest visuals for features not mentioned in the product information
- DO NOT suggest customer logos, testimonials, or data that hasn't been provided
- Keep descriptions professional and realistic
- If no product context is available, suggest generic sales visuals (process diagrams, value proposition charts)

Respond with a JSON object containing a "suggestions" array. Each suggestion should have:
{
  "suggestions": [
    {
      "title": "Brief descriptive title",
      "relevance": "Why this visual is relevant to the current conversation",
      "visualType": "Type of visual (e.g., dashboard screenshot, workflow diagram)",
      "description": "Detailed text description of what this visual would show"
    }
  ]
}

Respond ONLY with valid JSON, no markdown formatting.
`;

  console.log(`[Visual Assistance] Generating suggestions for call ${callId}, stage: ${currentStage}`);
  
  try {
    const response = await callGemini(prompt);
    const parsed = JSON.parse(response.trim());
    
    if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
      throw new Error('Invalid response format: missing suggestions array');
    }
    
    // Filter out duplicate suggestions
    const uniqueSuggestions: VisualSuggestion[] = [];
    
    for (const suggestion of parsed.suggestions) {
      const hash = generateSuggestionHash(suggestion.title, suggestion.visualType);
      
      if (!isDuplicateSuggestion(callId, hash)) {
        uniqueSuggestions.push({
          title: suggestion.title || 'Untitled Visual',
          relevance: suggestion.relevance || 'Relevant to current conversation',
          visualType: suggestion.visualType || 'illustration',
          description: suggestion.description || 'Visual description not available',
        });
        recordSuggestion(callId, hash);
      }
    }
    
    console.log(`[Visual Assistance] Generated ${uniqueSuggestions.length} unique suggestions for call ${callId}`);
    
    return { suggestions: uniqueSuggestions };
    
  } catch (error: any) {
    console.error('[Visual Assistance] Error generating suggestions:', error);
    
    // If parsing failed, check if it's a JSON parse error
    if (error.message?.includes('parse')) {
      throw new Error('Failed to parse AI response for visual suggestions');
    }
    
    // Re-throw other errors (network, API, etc.)
    throw error;
  }
}
