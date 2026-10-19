import config from '../config';
import Groq from 'groq-sdk';

// =====================================================
// AI Provider Service - Unified Provider Abstraction
// =====================================================

export enum AIProvider {
  GEMINI = 'gemini',
  GROQ = 'groq',
}

export enum TaskType {
  TRANSCRIPT_ANALYSIS = 'transcript-analysis',
  RESPONSE_SUGGESTION = 'response-suggestion',
  STAGE_SUGGESTION = 'stage-suggestion',
  INTELLIGENCE = 'intelligence',
  VISUAL_CONTEXT = 'visual-context',
}

// Internal interfaces (not exported, used for documentation)
// interface AIProviderConfig {
//   provider: AIProvider;
//   model: string;
//   apiKey: string;
// }

// interface AIRequest {
//   taskType: TaskType;
//   prompt: string;
//   callId: string;
// }

// interface AIResponse {
//   text: string;
//   provider: AIProvider;
//   model: string;
// }

// =====================================================
// Helper Functions
// =====================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getJitter(): number {
  return Math.floor(Math.random() * 100);
}

function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message || '';
  const code = error.code;
  const statusCode = error.statusCode || error.status;
  
  // HTTP status codes that warrant retry
  if (statusCode === 429 || statusCode === 503) return true;
  
  // Network errors
  if (code === 'ETIMEDOUT' || code === 'ECONNREFUSED') return true;
  
  // Timeout messages
  if (message.includes('timeout') || message.includes('ETIMEDOUT')) return true;
  
  return false;
}

// =====================================================
// Gemini Provider (native https for Windows cert handling)
// =====================================================

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
                const error: any = new Error('Gemini API quota exceeded or rate limit reached. Please wait and try again.');
                error.statusCode = 429;
                reject(error);
                return;
              }
              if (errorStatus === 503) {
                const error: any = new Error('Gemini service temporarily unavailable. Please try again.');
                error.statusCode = 503;
                reject(error);
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
          const err: any = new Error('Network error: Connection refused. Check your internet connection.');
          err.code = 'ECONNREFUSED';
          reject(err);
        } else if (error.code === 'ETIMEDOUT') {
          const err: any = new Error('Network error: Request timeout. Check your internet connection.');
          err.code = 'ETIMEDOUT';
          reject(err);
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
        const error: any = new Error('Request timeout (30s). Check your internet connection.');
        error.code = 'ETIMEDOUT';
        reject(error);
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
// Groq Provider
// =====================================================

async function callGroq(prompt: string): Promise<string> {
  try {
    const groq = new Groq({ apiKey: config.groq.apiKey });
    
    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b', // Updated: llama3-70b-8192 was decommissioned
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });
    
    const text = completion.choices[0]?.message?.content;
    if (!text) {
      throw new Error('Empty response from Groq');
    }
    
    return text;
  } catch (error: any) {
    // Handle Groq-specific errors
    const message = error.message || '';
    const statusCode = error.statusCode || error.status || error.response?.status;
    
    if (statusCode === 401 || message.includes('authentication') || message.includes('API key')) {
      throw new Error('Groq authentication failed. Verify GROQ_API_KEY in backend .env.');
    }
    
    if (statusCode === 429 || message.includes('rate limit')) {
      const err: any = new Error('Groq API rate limit reached. Please wait and try again.');
      err.statusCode = 429;
      throw err;
    }
    
    if (statusCode === 503 || message.includes('unavailable')) {
      const err: any = new Error('Groq service temporarily unavailable. Please try again.');
      err.statusCode = 503;
      throw err;
    }
    
    if (message.includes('context_length_exceeded') || message.includes('too long')) {
      throw new Error('Prompt too long for Groq model.');
    }
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      const err: any = new Error(`Network error calling Groq: ${error.message}`);
      err.code = error.code;
      throw err;
    }
    
    throw new Error(`Groq API error: ${error.message}`);
  }
}

// =====================================================
// Core Provider Selection & Retry Logic
// =====================================================

function determinePrimaryProvider(taskType: TaskType): AIProvider | null {
  const providerSetting = config.ai.provider;
  
  // Manual override to specific provider
  if (providerSetting === 'gemini') {
    return AIProvider.GEMINI;
  }
  
  if (providerSetting === 'groq') {
    // Visual tasks require Gemini (multimodal)
    if (taskType === TaskType.VISUAL_CONTEXT) {
      return AIProvider.GEMINI;
    }
    return config.groq.apiKey ? AIProvider.GROQ : null;
  }
  
  // Auto mode: route by task type
  if (providerSetting === 'auto') {
    if (taskType === TaskType.VISUAL_CONTEXT) {
      return AIProvider.GEMINI; // Multimodal required
    }
    
    // Text tasks prefer Groq if available
    if (config.groq.apiKey) {
      return AIProvider.GROQ;
    }
    
    // Fall back to Gemini
    return AIProvider.GEMINI;
  }
  
  return AIProvider.GEMINI; // Default
}

function getAlternateProvider(primary: AIProvider | null): AIProvider | null {
  if (!config.ai.fallbackEnabled) {
    return null;
  }
  
  if (primary === AIProvider.GEMINI && config.groq.apiKey) {
    return AIProvider.GROQ;
  }
  
  if (primary === AIProvider.GROQ) {
    return AIProvider.GEMINI;
  }
  
  return null;
}

async function callProvider(provider: AIProvider, prompt: string): Promise<string> {
  if (provider === AIProvider.GEMINI) {
    return await callGemini(prompt);
  } else {
    return await callGroq(prompt);
  }
}

// =====================================================
// Main Export: callAIProvider
// =====================================================

export async function callAIProvider(
  taskType: TaskType,
  prompt: string,
  callId: string
): Promise<string> {
  const primaryProvider = determinePrimaryProvider(taskType);
  
  if (!primaryProvider) {
    throw new Error('No AI provider available. Configure GEMINI_API_KEY or GROQ_API_KEY.');
  }
  
  const alternateProvider = getAlternateProvider(primaryProvider);
  
  let primaryError: Error | null = null;
  
  // Try primary provider with bounded retry
  const maxAttempts = 3;
  const backoffDelays = [1000, 2000, 4000]; // 1s, 2s, 4s
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const text = await callProvider(primaryProvider, prompt);
      if (attempt > 0) {
        console.log(`[AI Provider] ${primaryProvider} succeeded on attempt ${attempt + 1} for call ${callId}`);
      }
      return text;
    } catch (error: any) {
      primaryError = error;
      
      // Don't retry on non-retryable errors
      if (!isRetryableError(error)) {
        console.error(`[AI Provider] Non-retryable error from ${primaryProvider}:`, error.message);
        break;
      }
      
      // If we have more attempts, wait with backoff + jitter
      if (attempt < maxAttempts - 1) {
        const delay = backoffDelays[attempt] + getJitter();
        console.log(`[AI Provider] ${primaryProvider} failed (attempt ${attempt + 1}/${maxAttempts}), retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        console.error(`[AI Provider] ${primaryProvider} exhausted all ${maxAttempts} attempts`);
      }
    }
  }
  
  // If primary failed and we have an alternate, try it once
  if (alternateProvider && primaryError) {
    console.log(`[AI Provider] Primary provider ${primaryProvider} failed, falling back to ${alternateProvider}`);
    
    try {
      const text = await callProvider(alternateProvider, prompt);
      console.log(`[AI Provider] Fallback to ${alternateProvider} succeeded for call ${callId}`);
      return text;
    } catch (fallbackError: any) {
      // Both providers failed
      const primaryMsg = primaryError.message || 'Unknown error';
      const fallbackMsg = fallbackError.message || 'Unknown error';
      throw new Error(`AI request failed. Primary (${primaryProvider}): ${primaryMsg}. Fallback (${alternateProvider}): ${fallbackMsg}.`);
    }
  }
  
  // Only primary provider available and it failed
  if (primaryError) {
    throw primaryError;
  }
  
  throw new Error('AI request failed with unknown error.');
}
