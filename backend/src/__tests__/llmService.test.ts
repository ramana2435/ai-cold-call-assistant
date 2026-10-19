import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  analyzeTranscript,
  suggestNextStage,
  suggestResponse,
  getCallIntelligence,
  clearConversationContext,
} from '../services/llmService';
import { STAGE_NAMES } from '../types';

// Mock the @google/generative-ai module
jest.mock('@google/generative-ai');

describe('LLM Service', () => {
  let mockGenerateContent: jest.Mock;
  let mockGetGenerativeModel: jest.Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockGenerateContent = jest.fn();

    // Setup mock for generateContent
    mockGetGenerativeModel = jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    });

    // Mock GoogleGenerativeAI constructor
    (GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>).mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    } as any));
  });

  describe('analyzeTranscript', () => {
    it('should analyze transcript and return structured result', async () => {
      const mockResponse = {
        detectedStage: 2,
        keyPhrases: ['product update', 'new features'],
        sentiment: 'positive',
        summary: 'Caller explained the purpose of the call',
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      const result = await analyzeTranscript(
        'call-123',
        'Hi, I am calling to tell you about our new product features',
        2
      );

      expect(result.detectedStage).toBe(2);
      expect(result.detectedStageName).toBe(STAGE_NAMES[2]);
      expect(result.keyPhrases).toContain('product update');
      expect(result.sentiment).toBe('positive');
      expect(result.summary).toBeTruthy();

      // Verify prompt includes stage names
      const promptArg = mockGenerateContent.mock.calls[0][0];
      expect(promptArg).toContain(STAGE_NAMES[1]);
      expect(promptArg).toContain(STAGE_NAMES[2]);
      expect(promptArg).toContain('Hi, I am calling to tell you about our new product features');
    });

    it('should handle different stages correctly', async () => {
      const mockResponse = {
        detectedStage: 5,
        keyPhrases: ['need help', 'looking for solution'],
        sentiment: 'neutral',
        summary: 'Prospect expressed their needs',
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      const result = await analyzeTranscript(
        'call-456',
        'We are looking for a solution to improve our sales process',
        5
      );

      expect(result.detectedStage).toBe(5);
      expect(result.detectedStageName).toBe(STAGE_NAMES[5]);
      expect(result.keyPhrases.length).toBeGreaterThan(0);
    });

    it('should store conversation context', async () => {
      const mockResponse = {
        detectedStage: 1,
        keyPhrases: ['hello'],
        sentiment: 'neutral',
        summary: 'Opening',
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      // First call
      await analyzeTranscript('call-context-test', 'Hello, this is John', 1);

      // Second call should have context from first
      await analyzeTranscript('call-context-test', 'I am calling about our services', 2);

      // Verify generateContent was called twice
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('should throw error on Gemini API failure', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Network error'));

      await expect(
        analyzeTranscript('call-error', 'test transcript', 1)
      ).rejects.toThrow('Gemini API error');
    });

    it('should handle quota exceeded error', async () => {
      mockGenerateContent.mockRejectedValue(new Error('quota exceeded'));

      await expect(
        analyzeTranscript('call-quota', 'test transcript', 1)
      ).rejects.toThrow('Gemini API quota exceeded');
    });

    it('should handle rate limit error', async () => {
      mockGenerateContent.mockRejectedValue(new Error('rate limit reached'));

      await expect(
        analyzeTranscript('call-rate', 'test transcript', 1)
      ).rejects.toThrow('Gemini API rate limit reached');
    });

    it('should throw error on invalid JSON response', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'This is not valid JSON',
        },
      });

      await expect(
        analyzeTranscript('call-invalid', 'test transcript', 1)
      ).rejects.toThrow('Failed to parse Gemini response');
    });
  });

  describe('suggestNextStage', () => {
    it('should return valid stage recommendation', async () => {
      const mockResponse = {
        recommendedStage: 3,
        confidence: 0.85,
        reasoning: 'Prospect seems engaged, good time to ask for permission',
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      const result = await suggestNextStage(
        'call-123',
        2,
        'We just discussed the purpose of the call'
      );

      expect(result.recommendedStage).toBe(3);
      expect(result.recommendedStageName).toBe(STAGE_NAMES[3]);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.reasoning).toBeTruthy();
    });

    it('should return stage numbers between 1 and 8', async () => {
      for (let stage = 1; stage <= 8; stage++) {
        const mockResponse = {
          recommendedStage: stage,
          confidence: 0.7,
          reasoning: `Move to stage ${stage}`,
        };

        mockGenerateContent.mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockResponse),
          },
        });

        const result = await suggestNextStage('call-stages', 1, 'test context');
        expect(result.recommendedStage).toBeGreaterThanOrEqual(1);
        expect(result.recommendedStage).toBeLessThanOrEqual(8);
      }
    });

    it('should include stage context in prompt', async () => {
      const mockResponse = {
        recommendedStage: 4,
        confidence: 0.75,
        reasoning: 'Time to learn about their business',
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      await suggestNextStage('call-123', 3, 'Prospect agreed to talk');

      const promptArg = mockGenerateContent.mock.calls[0][0];
      expect(promptArg).toContain(STAGE_NAMES[3]);
      expect(promptArg).toContain('Prospect agreed to talk');
    });

    it('should handle API errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API key invalid'));

      await expect(
        suggestNextStage('call-error', 1, 'context')
      ).rejects.toThrow('Invalid Gemini API key');
    });
  });

  describe('suggestResponse', () => {
    it('should return array of response suggestions', async () => {
      const mockResponse = {
        responses: [
          'That sounds interesting. Could you tell me more about your current process?',
          'I understand. What challenges are you facing with your current solution?',
          'Great! How would solving this help your business?',
        ],
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      const result = await suggestResponse(
        'call-123',
        'We are having issues with our current system',
        'Their business'
      );

      expect(Array.isArray(result.responses)).toBe(true);
      expect(result.responses.length).toBe(3);
      expect(result.responses[0]).toBeTruthy();
    });

    it('should include prospect words and stage in prompt', async () => {
      const mockResponse = {
        responses: ['Response 1', 'Response 2', 'Response 3'],
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      await suggestResponse(
        'call-456',
        'I am not sure if this is right for us',
        'Objection'
      );

      const promptArg = mockGenerateContent.mock.calls[0][0];
      expect(promptArg).toContain('Objection');
      expect(promptArg).toContain('I am not sure if this is right for us');
    });

    it('should use conversation history for context', async () => {
      const mockResponse = {
        responses: ['Response 1', 'Response 2', 'Response 3'],
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      // Build up some conversation history
      await analyzeTranscript('call-history', 'First message', 1);
      await suggestResponse('call-history', 'Second message', 'Opening');

      // Verify history is used
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should handle empty responses array', async () => {
      const mockResponse = {
        responses: [],
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      const result = await suggestResponse('call-empty', 'test', 'Opening');
      expect(result.responses).toEqual([]);
    });
  });

  describe('getCallIntelligence', () => {
    it('should return intelligence summary with conversation history', async () => {
      const mockResponse = {
        overallSentiment: 'positive',
        criticalPhrases: ['product features', 'pricing', 'next steps'],
        recommendedActions: ['Send proposal', 'Schedule follow-up'],
        confidenceScore: 0.85,
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      // Build conversation history first
      await analyzeTranscript('call-intel', 'Hello, this is a test call', 1);
      
      const result = await getCallIntelligence('call-intel');

      expect(result.overallSentiment).toBe('positive');
      expect(result.criticalPhrases.length).toBeGreaterThan(0);
      expect(result.recommendedActions.length).toBeGreaterThan(0);
      expect(result.confidenceScore).toBeGreaterThan(0);
    });

    it('should return default intelligence for empty conversation', async () => {
      const result = await getCallIntelligence('call-no-history');

      expect(result.overallSentiment).toBe('neutral');
      expect(result.criticalPhrases).toEqual([]);
      expect(result.confidenceScore).toBe(0.5);
    });

    it('should analyze complete conversation', async () => {
      const mockResponse = {
        overallSentiment: 'neutral',
        criticalPhrases: ['initial contact'],
        recommendedActions: ['Continue conversation'],
        confidenceScore: 0.7,
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      // Build multi-turn conversation
      await analyzeTranscript('call-complete', 'Opening statement', 1);
      await analyzeTranscript('call-complete', 'Purpose explanation', 2);
      
      const result = await getCallIntelligence('call-complete');

      expect(result.confidenceScore).toBeGreaterThan(0);
    });
  });

  describe('clearConversationContext', () => {
    it('should clear conversation context for a call', async () => {
      const mockResponse = {
        detectedStage: 1,
        keyPhrases: ['test'],
        sentiment: 'neutral',
        summary: 'test',
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      // Add some conversation history
      await analyzeTranscript('call-clear', 'Test message', 1);

      // Clear it
      clearConversationContext('call-clear');

      // Get intelligence should show empty conversation
      const result = await getCallIntelligence('call-clear');
      expect(result.criticalPhrases).toEqual([]);
    });

    it('should not affect other call contexts', async () => {
      const mockResponse = {
        detectedStage: 1,
        keyPhrases: ['test'],
        sentiment: 'neutral',
        summary: 'test',
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResponse),
        },
      });

      // Add history to two different calls
      await analyzeTranscript('call-1', 'Message 1', 1);
      await analyzeTranscript('call-2', 'Message 2', 1);

      // Clear only one
      clearConversationContext('call-1');

      // call-2 should still have history
      const mockIntelResponse = {
        overallSentiment: 'neutral',
        criticalPhrases: ['test'],
        recommendedActions: ['test'],
        confidenceScore: 0.6,
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockIntelResponse),
        },
      });

      const result = await getCallIntelligence('call-2');
      expect(result.confidenceScore).toBeGreaterThan(0.5);
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Network timeout'));

      await expect(
        analyzeTranscript('call-network', 'test', 1)
      ).rejects.toThrow('Gemini API error');
    });

    it('should handle malformed responses', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '{ incomplete json',
        },
      });

      await expect(
        suggestNextStage('call-malformed', 1, 'context')
      ).rejects.toThrow('Failed to parse Gemini response');
    });
  });
});
