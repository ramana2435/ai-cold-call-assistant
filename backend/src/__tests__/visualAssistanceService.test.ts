import { analyzeVisualContext, clearSuggestionHistory } from '../services/visualAssistanceService';

// Mock the config module BEFORE importing the service
jest.mock('../config/index', () => ({
  __esModule: true,
  default: {
    gemini: {
      apiKey: 'test-api-key-12345',
      model: 'gemini-3.5-flash',
    },
  },
}));

// Mock https module
const mockHttpsRequest = jest.fn();
jest.mock('https', () => ({
  request: mockHttpsRequest,
}));

describe('Visual Assistance Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation for https.request
    mockHttpsRequest.mockImplementation((_options: any, callback: any) => {
      const mockRes: any = {
        on: jest.fn((_event: string, _handler?: any): any => {
          return mockRes;
        }),
        statusCode: 200,
      };
      
      // Call the callback immediately with mock response
      callback(mockRes);
      
      return {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        destroy: jest.fn(),
      };
    });
  });

  describe('analyzeVisualContext', () => {
    it('should generate visual suggestions successfully', async () => {
      const mockApiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                suggestions: [
                  {
                    title: 'Fee Management Dashboard',
                    relevance: 'Prospect mentioned challenges with fee collection',
                    visualType: 'dashboard screenshot',
                    description: 'A comprehensive dashboard showing fee collection metrics, pending payments, and automated reminders',
                  },
                  {
                    title: 'Student Enrollment Workflow',
                    relevance: 'Discussing enrollment process improvements',
                    visualType: 'workflow diagram',
                    description: 'Step-by-step workflow diagram showing automated enrollment process from application to admission',
                  },
                ],
              }),
            }],
          },
        }],
      };

      mockHttpsRequest.mockImplementation((_options: any, callback: any) => {
        const mockRes: any = {
          on: jest.fn((event: string, handler: any): any => {
            if (event === 'data') {
              handler(JSON.stringify(mockApiResponse));
            }
            if (event === 'end') {
              handler();
            }
            return mockRes;
          }),
          statusCode: 200,
        };
        callback(mockRes);
        return {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
        };
      });

      const result = await analyzeVisualContext({
        callId: 'call-123',
        currentStage: 'Their business',
        recentTranscript: 'We have issues with fee collection and student enrollment',
        knowledgeContext: {
          product: {
            product_name: 'College ERP System',
            features: [
              { name: 'Fee Management', description: 'Automated fee collection and tracking' },
              { name: 'Enrollment System', description: 'Streamlined student enrollment' },
            ],
          },
        },
      });

      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[0].title).toBe('Fee Management Dashboard');
      expect(result.suggestions[0].visualType).toBe('dashboard screenshot');
      expect(result.suggestions[1].title).toBe('Student Enrollment Workflow');
    });

    it('should generate context-aware suggestions based on product and organization', async () => {
      const mockApiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                suggestions: [
                  {
                    title: 'Hospital Billing Workflow',
                    relevance: 'Addressing billing complexity concerns for hospital',
                    visualType: 'workflow diagram',
                    description: 'End-to-end billing workflow from patient admission to insurance claims',
                  },
                ],
              }),
            }],
          },
        }],
      };

      mockHttpsRequest.mockImplementation((_options: any, callback: any) => {
        const mockRes: any = {
          on: jest.fn((event: string, handler: any): any => {
            if (event === 'data') {
              handler(JSON.stringify(mockApiResponse));
            }
            if (event === 'end') {
              handler();
            }
            return mockRes;
          }),
          statusCode: 200,
        };
        callback(mockRes);
        return {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
        };
      });

      const result = await analyzeVisualContext({
        callId: 'call-hospital',
        currentStage: 'Their need, in their words',
        recentTranscript: 'Our billing process is very complex and error-prone',
        knowledgeContext: {
          product: {
            product_name: 'Healthcare Management System',
            features: [
              { name: 'Billing Automation', description: 'Automated billing and claims' },
            ],
          },
          organization: {
            organization_name: 'City General Hospital',
            industry: 'Healthcare',
            business_challenges: 'Complex billing workflows and insurance claims',
          },
        },
      });

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].title).toContain('Hospital');
      expect(result.suggestions[0].relevance).toContain('billing');
    });

    it('should prevent duplicate suggestions for the same call', async () => {
      const mockApiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                suggestions: [
                  {
                    title: 'Product Overview',
                    relevance: 'General introduction',
                    visualType: 'illustration',
                    description: 'Overview of product features',
                  },
                ],
              }),
            }],
          },
        }],
      };

      mockHttpsRequest.mockImplementation((_options: any, callback: any) => {
        const mockRes: any = {
          on: jest.fn((event: string, handler: any): any => {
            if (event === 'data') {
              handler(JSON.stringify(mockApiResponse));
            }
            if (event === 'end') {
              handler();
            }
            return mockRes;
          }),
          statusCode: 200,
        };
        callback(mockRes);
        return {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
        };
      });

      // First call
      const result1 = await analyzeVisualContext({
        callId: 'call-duplicate-test',
        currentStage: 'Opening',
        recentTranscript: 'Hello',
      });

      expect(result1.suggestions).toHaveLength(1);

      // Second call with same suggestion should filter it out
      const result2 = await analyzeVisualContext({
        callId: 'call-duplicate-test',
        currentStage: 'Purpose',
        recentTranscript: 'Let me explain',
      });

      expect(result2.suggestions).toHaveLength(0);
    });

    it('should handle empty conversation gracefully', async () => {
      const mockApiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                suggestions: [
                  {
                    title: 'Product Introduction',
                    relevance: 'Starting the conversation',
                    visualType: 'feature illustration',
                    description: 'High-level product overview for opening conversation',
                  },
                ],
              }),
            }],
          },
        }],
      };

      mockHttpsRequest.mockImplementation((_options: any, callback: any) => {
        const mockRes: any = {
          on: jest.fn((event: string, handler: any): any => {
            if (event === 'data') {
              handler(JSON.stringify(mockApiResponse));
            }
            if (event === 'end') {
              handler();
            }
            return mockRes;
          }),
          statusCode: 200,
        };
        callback(mockRes);
        return {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
        };
      });

      const result = await analyzeVisualContext({
        callId: 'call-empty',
        currentStage: 'Opening',
        recentTranscript: '',
      });

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].title).toBeTruthy();
    });

    it('should handle API authentication errors', async () => {
      const mockErrorResponse = {
        error: {
          message: 'API key not valid',
          code: 401,
        },
      };

      mockHttpsRequest.mockImplementation((_options: any, callback: any) => {
        const mockRes: any = {
          on: jest.fn((event: string, handler: any): any => {
            if (event === 'data') {
              handler(JSON.stringify(mockErrorResponse));
            }
            if (event === 'end') {
              handler();
            }
            return mockRes;
          }),
          statusCode: 401,
        };
        callback(mockRes);
        return {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
        };
      });

      await expect(
        analyzeVisualContext({
          callId: 'call-auth-error',
          currentStage: 'Opening',
          recentTranscript: 'test',
        })
      ).rejects.toThrow('Authentication failed');
    });

    it('should handle API rate limit errors', async () => {
      const mockErrorResponse = {
        error: {
          message: 'Quota exceeded',
          code: 429,
        },
      };

      mockHttpsRequest.mockImplementation((_options: any, callback: any) => {
        const mockRes: any = {
          on: jest.fn((event: string, handler: any): any => {
            if (event === 'data') {
              handler(JSON.stringify(mockErrorResponse));
            }
            if (event === 'end') {
              handler();
            }
            return mockRes;
          }),
          statusCode: 429,
        };
        callback(mockRes);
        return {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
        };
      });

      await expect(
        analyzeVisualContext({
          callId: 'call-rate-limit',
          currentStage: 'Opening',
          recentTranscript: 'test',
        })
      ).rejects.toThrow('quota exceeded or rate limit reached');
    });

    it('should handle network errors', async () => {
      mockHttpsRequest.mockImplementation(() => {
        const req: any = {
          on: jest.fn((event: string, handler: any): any => {
            if (event === 'error') {
              const error: NodeJS.ErrnoException = new Error('Connection refused');
              error.code = 'ECONNREFUSED';
              handler(error);
            }
            return req;
          }),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
        };
        return req;
      });

      await expect(
        analyzeVisualContext({
          callId: 'call-network-error',
          currentStage: 'Opening',
          recentTranscript: 'test',
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle invalid JSON response', async () => {
      mockHttpsRequest.mockImplementation((_options: any, callback: any) => {
        const mockRes: any = {
          on: jest.fn((event: string, handler: any): any => {
            if (event === 'data') {
              handler('This is not valid JSON');
            }
            if (event === 'end') {
              handler();
            }
            return mockRes;
          }),
          statusCode: 200,
        };
        callback(mockRes);
        return {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
        };
      });

      await expect(
        analyzeVisualContext({
          callId: 'call-invalid-json',
          currentStage: 'Opening',
          recentTranscript: 'test',
        })
      ).rejects.toThrow();
    });

    it('should handle malformed suggestions response', async () => {
      const mockApiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                // Missing suggestions array
                data: 'something else',
              }),
            }],
          },
        }],
      };

      mockHttpsRequest.mockImplementation((_options: any, callback: any) => {
        const mockRes: any = {
          on: jest.fn((event: string, handler: any): any => {
            if (event === 'data') {
              handler(JSON.stringify(mockApiResponse));
            }
            if (event === 'end') {
              handler();
            }
            return mockRes;
          }),
          statusCode: 200,
        };
        callback(mockRes);
        return {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
        };
      });

      await expect(
        analyzeVisualContext({
          callId: 'call-malformed',
          currentStage: 'Opening',
          recentTranscript: 'test',
        })
      ).rejects.toThrow('Invalid response format');
    });
  });

  describe('clearSuggestionHistory', () => {
    it('should clear suggestion history for a specific call', async () => {
      const mockApiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                suggestions: [
                  {
                    title: 'Test Visual',
                    relevance: 'Test',
                    visualType: 'test',
                    description: 'Test description',
                  },
                ],
              }),
            }],
          },
        }],
      };

      mockHttpsRequest.mockImplementation((_options: any, callback: any) => {
        const mockRes: any = {
          on: jest.fn((event: string, handler: any): any => {
            if (event === 'data') {
              handler(JSON.stringify(mockApiResponse));
            }
            if (event === 'end') {
              handler();
            }
            return mockRes;
          }),
          statusCode: 200,
        };
        callback(mockRes);
        return {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
        };
      });

      // Generate a suggestion
      await analyzeVisualContext({
        callId: 'call-clear-test',
        currentStage: 'Opening',
        recentTranscript: 'test',
      });

      // Clear history
      clearSuggestionHistory('call-clear-test');

      // Same suggestion should appear again after clearing
      const result = await analyzeVisualContext({
        callId: 'call-clear-test',
        currentStage: 'Opening',
        recentTranscript: 'test',
      });

      expect(result.suggestions).toHaveLength(1);
    });
  });
});
