// Visual Assistance Service - Context-Aware Visual Suggestions
import { StageName } from '../types';
import { callAIProvider, TaskType } from './aiProviderService';

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

// callGemini removed - now using aiProviderService

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
    const response = await callAIProvider(TaskType.VISUAL_CONTEXT, prompt, callId);
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
