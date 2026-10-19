import { callAIProvider, TaskType } from '../services/aiProviderService';

// Mock dependencies
jest.mock('groq-sdk');
jest.mock('https');
jest.mock('../config', () => {
  const mockConfig = {
    gemini: {
      apiKey: 'FAKE_GEMINI_KEY',
      model: 'gemini-3.5-flash',
    },
    groq: {
      apiKey: 'FAKE_GROQ_KEY',
    },
    ai: {
      provider: 'auto',
      fallbackEnabled: true,
    },
  };
  return {
    default: mockConfig,
    __esModule: true,
  };
});

import Groq from 'groq-sdk';
import https from 'https';
import config from '../config';

describe('aiProviderService', () => {
  let mockGroqCreate: jest.Mock;
  let mockHttpsRequest: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Groq SDK
    mockGroqCreate = jest.fn();
    (Groq as jest.MockedClass<typeof Groq>).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockGroqCreate,
        },
      },
    } as any));
    
    // Mock https.request for Gemini
    mockHttpsRequest = jest.fn();
    (https.request as jest.Mock) = mockHttpsRequest;
  });

  describe('Groq success', () => {
    it('should successfully call Groq and return text', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Groq response text',
            },
          },
        ],
      });

      const result = await callAIProvider(
        TaskType.TRANSCRIPT_ANALYSIS,
        'Test prompt',
        'test-call-id'
      );

      expect(result).toBe('Groq response text');
      expect(mockGroqCreate).toHaveBeenCalledWith({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: 'Test prompt' }],
        temperature: 0.7,
      });
    });
  });

  describe('Gemini success', () => {
    it('should successfully call Gemini and return text', async () => {
      // Mock https request for Gemini
      const mockResponse = {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [
                      { text: 'Gemini response text' },
                    ],
                  },
                },
              ],
            }));
          } else if (event === 'end') {
            callback();
          }
        }),
        statusCode: 200,
      };

      const mockRequest = {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };

      mockHttpsRequest.mockImplementation((_options, callback) => {
        callback(mockResponse);
        return mockRequest;
      });

      const result = await callAIProvider(
        TaskType.VISUAL_CONTEXT,
        'Test prompt',
        'test-call-id'
      );

      expect(result).toBe('Gemini response text');
      expect(mockHttpsRequest).toHaveBeenCalled();
    });
  });

  describe('Task routing', () => {
    it('should route transcript-analysis to Groq in auto mode', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: 'Groq response' } }],
      });

      await callAIProvider(TaskType.TRANSCRIPT_ANALYSIS, 'Test', 'call-id');

      expect(mockGroqCreate).toHaveBeenCalled();
      expect(mockHttpsRequest).not.toHaveBeenCalled();
    });

    it('should route visual-context to Gemini even with Groq available', async () => {
      const mockResponse = {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(JSON.stringify({
              candidates: [{ content: { parts: [{ text: 'Gemini visual response' }] } }],
            }));
          } else if (event === 'end') {
            callback();
          }
        }),
        statusCode: 200,
      };

      const mockRequest = {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };

      mockHttpsRequest.mockImplementation((_options, callback) => {
        callback(mockResponse);
        return mockRequest;
      });

      await callAIProvider(TaskType.VISUAL_CONTEXT, 'Test', 'call-id');

      expect(mockHttpsRequest).toHaveBeenCalled();
      expect(mockGroqCreate).not.toHaveBeenCalled();
    });

    it('should route response-suggestion to Groq in auto mode', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: 'Groq response' } }],
      });

      await callAIProvider(TaskType.RESPONSE_SUGGESTION, 'Test', 'call-id');

      expect(mockGroqCreate).toHaveBeenCalled();
    });

    it('should route stage-suggestion to Groq in auto mode', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: 'Groq response' } }],
      });

      await callAIProvider(TaskType.STAGE_SUGGESTION, 'Test', 'call-id');

      expect(mockGroqCreate).toHaveBeenCalled();
    });

    it('should route intelligence to Groq in auto mode', async () => {
      mockGroqCreate.mockResolvedValue({
        choices: [{ message: { content: 'Groq response' } }],
      });

      await callAIProvider(TaskType.INTELLIGENCE, 'Test', 'call-id');

      expect(mockGroqCreate).toHaveBeenCalled();
    });
  });

  describe('Fallback on 429', () => {
    it('should fall back to Gemini when Groq returns 429', async () => {
      // First 3 attempts: Groq fails with 429
      const groqError: any = new Error('Groq API rate limit reached. Please wait and try again.');
      groqError.statusCode = 429;
      mockGroqCreate.mockRejectedValue(groqError);

      // Fallback: Gemini succeeds
      const mockResponse = {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(JSON.stringify({
              candidates: [{ content: { parts: [{ text: 'Gemini fallback response' }] } }],
            }));
          } else if (event === 'end') {
            callback();
          }
        }),
        statusCode: 200,
      };

      const mockRequest = {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };

      mockHttpsRequest.mockImplementation((_options, callback) => {
        callback(mockResponse);
        return mockRequest;
      });

      const result = await callAIProvider(
        TaskType.TRANSCRIPT_ANALYSIS,
        'Test',
        'call-id'
      );

      expect(result).toBe('Gemini fallback response');
      expect(mockGroqCreate).toHaveBeenCalledTimes(3); // 3 retry attempts
      expect(mockHttpsRequest).toHaveBeenCalled(); // Fallback to Gemini
    }, 15000); // Increase timeout for retry delays
  });

  describe('Both providers unavailable', () => {
    it('should throw error with both provider names when both fail', async () => {
      // Groq fails with 429
      const groqError: any = new Error('Groq API rate limit reached. Please wait and try again.');
      groqError.statusCode = 429;
      mockGroqCreate.mockRejectedValue(groqError);

      // Gemini fails with 503
      const mockResponse = {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(JSON.stringify({
              error: {
                code: 503,
                message: 'Service temporarily unavailable',
              },
            }));
          } else if (event === 'end') {
            callback();
          }
        }),
        statusCode: 503,
      };

      const mockRequest = {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };

      mockHttpsRequest.mockImplementation((_options, callback) => {
        callback(mockResponse);
        return mockRequest;
      });

      await expect(
        callAIProvider(TaskType.TRANSCRIPT_ANALYSIS, 'Test', 'call-id')
      ).rejects.toThrow(/AI request failed.*Primary.*Fallback/);
    }, 15000);
  });

  describe('Retry with backoff', () => {
    it('should retry with exponential backoff on timeout', async () => {
      const startTime = Date.now();
      
      // First 2 attempts fail with timeout
      const timeoutError: any = new Error('Network error: Request timeout. Check your internet connection.');
      timeoutError.code = 'ETIMEDOUT';
      
      mockGroqCreate
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Success on attempt 3' } }],
        });

      const result = await callAIProvider(
        TaskType.TRANSCRIPT_ANALYSIS,
        'Test',
        'call-id'
      );

      const elapsedTime = Date.now() - startTime;

      expect(result).toBe('Success on attempt 3');
      expect(mockGroqCreate).toHaveBeenCalledTimes(3);
      // Should have delays: ~1s + ~2s = ~3s total (with jitter)
      expect(elapsedTime).toBeGreaterThan(2900); // Allow some timing variance
      expect(elapsedTime).toBeLessThan(5000); // But not too long
    }, 15000);
  });

  describe('Missing Groq key', () => {
    it('should use Gemini when GROQ_API_KEY is missing', async () => {
      // Temporarily remove Groq key
      const originalGroqKey = config.groq.apiKey;
      config.groq.apiKey = '';

      const mockResponse = {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(JSON.stringify({
              candidates: [{ content: { parts: [{ text: 'Gemini response' }] } }],
            }));
          } else if (event === 'end') {
            callback();
          }
        }),
        statusCode: 200,
      };

      const mockRequest = {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };

      mockHttpsRequest.mockImplementation((_options, callback) => {
        callback(mockResponse);
        return mockRequest;
      });

      const result = await callAIProvider(
        TaskType.TRANSCRIPT_ANALYSIS,
        'Test',
        'call-id'
      );

      expect(result).toBe('Gemini response');
      expect(mockHttpsRequest).toHaveBeenCalled();
      expect(mockGroqCreate).not.toHaveBeenCalled();

      // Restore Groq key
      config.groq.apiKey = originalGroqKey;
    });
  });

  describe('Manual provider override', () => {
    it('should use Gemini for transcript-analysis when AI_PROVIDER=gemini', async () => {
      const originalProvider = config.ai.provider;
      config.ai.provider = 'gemini';

      const mockResponse = {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(JSON.stringify({
              candidates: [{ content: { parts: [{ text: 'Gemini response' }] } }],
            }));
          } else if (event === 'end') {
            callback();
          }
        }),
        statusCode: 200,
      };

      const mockRequest = {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };

      mockHttpsRequest.mockImplementation((_options, callback) => {
        callback(mockResponse);
        return mockRequest;
      });

      const result = await callAIProvider(
        TaskType.TRANSCRIPT_ANALYSIS,
        'Test',
        'call-id'
      );

      expect(result).toBe('Gemini response');
      expect(mockHttpsRequest).toHaveBeenCalled();
      expect(mockGroqCreate).not.toHaveBeenCalled();

      config.ai.provider = originalProvider;
    });
  });

  describe('Non-retryable errors', () => {
    it('should not retry on 401 authentication error', async () => {
      const authError = new Error('Groq authentication failed. Verify GROQ_API_KEY in backend .env.');
      mockGroqCreate.mockRejectedValue(authError);

      await expect(
        callAIProvider(TaskType.TRANSCRIPT_ANALYSIS, 'Test', 'call-id')
      ).rejects.toThrow('authentication');

      // Should not retry (only 1 attempt)
      expect(mockGroqCreate).toHaveBeenCalledTimes(1);
    });
  });
});
