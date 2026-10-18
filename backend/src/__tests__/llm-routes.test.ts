/**
 * Tests for LLM API endpoints
 * Uses mocked LLM service functions
 */
import request from 'supertest';
import { createApp } from '../app';
import * as llmService from '../services/llmService';
import * as callService from '../services/callService';

// Mock the services
jest.mock('../services/llmService');
jest.mock('../services/callService');

describe('LLM API Endpoints', () => {
  const app = createApp();
  const mockCallId = 'cf0a96e3-2c1d-4d0a-bde2-d8e27e31134d';
  
  const mockCall = {
    id: mockCallId,
    prospect_name: 'John Doe',
    company_name: 'Acme Corp',
    current_stage_number: 1,
    current_stage_name: 'Opening',
    reached_stage_number: 1,
    reached_stage_name: 'Opening',
    status: 'in_progress',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /calls/:id/analyze', () => {
    it('should analyze transcript successfully', async () => {
      const mockAnalysis = {
        detectedStage: 2,
        detectedStageName: 'Purpose',
        keyPhrases: ['product update', 'new features'],
        sentiment: 'positive',
        summary: 'Caller explained the purpose',
      };

      (callService.getCallById as jest.Mock).mockResolvedValue(mockCall);
      (llmService.analyzeTranscript as jest.Mock).mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .post(`/calls/${mockCallId}/analyze`)
        .send({
          transcript: 'Hi, I\'m calling about our new product update',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAnalysis);
      expect(llmService.analyzeTranscript).toHaveBeenCalledWith(
        mockCallId,
        'Hi, I\'m calling about our new product update',
        1 // current_stage_number from mock call
      );
    });

    it('should use provided currentStage if specified', async () => {
      const mockAnalysis = {
        detectedStage: 3,
        detectedStageName: 'Permission',
        keyPhrases: ['quick question'],
        sentiment: 'neutral',
        summary: 'Asked for permission',
      };

      (callService.getCallById as jest.Mock).mockResolvedValue(mockCall);
      (llmService.analyzeTranscript as jest.Mock).mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .post(`/calls/${mockCallId}/analyze`)
        .send({
          transcript: 'Do you have a moment?',
          currentStage: 3,
        });

      expect(response.status).toBe(200);
      expect(llmService.analyzeTranscript).toHaveBeenCalledWith(
        mockCallId,
        'Do you have a moment?',
        3
      );
    });

    it('should return 404 if call not found', async () => {
      (callService.getCallById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post(`/calls/${mockCallId}/analyze`)
        .send({
          transcript: 'Test transcript',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Call not found');
    });

    it('should validate transcript is required', async () => {
      const response = await request(app)
        .post(`/calls/${mockCallId}/analyze`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle Gemini quota exceeded error', async () => {
      (callService.getCallById as jest.Mock).mockResolvedValue(mockCall);
      (llmService.analyzeTranscript as jest.Mock).mockRejectedValue(
        new Error('Gemini API quota exceeded. Please try again later.')
      );

      const response = await request(app)
        .post(`/calls/${mockCallId}/analyze`)
        .send({
          transcript: 'Test transcript',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /calls/:id/suggest-stage', () => {
    it('should suggest next stage successfully', async () => {
      const mockRecommendation = {
        recommendedStage: 2,
        recommendedStageName: 'Purpose',
        confidence: 0.85,
        reasoning: 'Opening completed, ready to explain purpose',
      };

      (callService.getCallById as jest.Mock).mockResolvedValue(mockCall);
      (llmService.suggestNextStage as jest.Mock).mockResolvedValue(mockRecommendation);

      const response = await request(app)
        .post(`/calls/${mockCallId}/suggest-stage`)
        .send({
          conversationSummary: 'Greeted prospect, they responded positively',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockRecommendation);
      expect(llmService.suggestNextStage).toHaveBeenCalledWith(
        mockCallId,
        1,
        'Greeted prospect, they responded positively'
      );
    });

    it('should work with empty conversation summary', async () => {
      const mockRecommendation = {
        recommendedStage: 2,
        recommendedStageName: 'Purpose',
        confidence: 0.7,
        reasoning: 'Move to purpose stage',
      };

      (callService.getCallById as jest.Mock).mockResolvedValue(mockCall);
      (llmService.suggestNextStage as jest.Mock).mockResolvedValue(mockRecommendation);

      const response = await request(app)
        .post(`/calls/${mockCallId}/suggest-stage`)
        .send({});

      expect(response.status).toBe(200);
      expect(llmService.suggestNextStage).toHaveBeenCalledWith(
        mockCallId,
        1,
        ''
      );
    });

    it('should return 404 if call not found', async () => {
      (callService.getCallById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post(`/calls/${mockCallId}/suggest-stage`)
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Call not found');
    });
  });

  describe('POST /calls/:id/suggest-response', () => {
    it('should suggest responses successfully', async () => {
      const mockSuggestions = {
        responses: [
          'That\'s great to hear! Tell me more about your current process.',
          'I appreciate you sharing that. How is that working for you?',
          'Interesting! What challenges are you facing with that approach?',
        ],
      };

      (callService.getCallById as jest.Mock).mockResolvedValue(mockCall);
      (llmService.suggestResponse as jest.Mock).mockResolvedValue(mockSuggestions);

      const response = await request(app)
        .post(`/calls/${mockCallId}/suggest-response`)
        .send({
          prospectLastWords: 'We use spreadsheets for everything',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSuggestions);
      expect(response.body.data.responses).toHaveLength(3);
      expect(llmService.suggestResponse).toHaveBeenCalledWith(
        mockCallId,
        'We use spreadsheets for everything',
        'Opening'
      );
    });

    it('should validate prospectLastWords is required', async () => {
      const response = await request(app)
        .post(`/calls/${mockCallId}/suggest-response`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 if call not found', async () => {
      (callService.getCallById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post(`/calls/${mockCallId}/suggest-response`)
        .send({
          prospectLastWords: 'Not interested',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Call not found');
    });

    it('should handle rate limit errors', async () => {
      (callService.getCallById as jest.Mock).mockResolvedValue(mockCall);
      (llmService.suggestResponse as jest.Mock).mockRejectedValue(
        new Error('Gemini API rate limit reached. Please wait and retry.')
      );

      const response = await request(app)
        .post(`/calls/${mockCallId}/suggest-response`)
        .send({
          prospectLastWords: 'Tell me more',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /calls/:id/intelligence', () => {
    it('should get call intelligence successfully', async () => {
      const mockIntelligence = {
        overallSentiment: 'positive',
        keyTopics: ['product features', 'pricing', 'timeline'],
        prospectInterestLevel: 'high',
        recommendedNextActions: [
          'Schedule demo',
          'Send pricing information',
          'Follow up next week',
        ],
        conversationSummary: 'Prospect is interested in the product and wants more details',
      };

      (callService.getCallById as jest.Mock).mockResolvedValue(mockCall);
      (llmService.getCallIntelligence as jest.Mock).mockResolvedValue(mockIntelligence);

      const response = await request(app)
        .get(`/calls/${mockCallId}/intelligence`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockIntelligence);
      expect(llmService.getCallIntelligence).toHaveBeenCalledWith(mockCallId);
    });

    it('should return 404 if call not found', async () => {
      (callService.getCallById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get(`/calls/${mockCallId}/intelligence`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Call not found');
    });

    it('should validate call ID format', async () => {
      const response = await request(app)
        .get('/calls/invalid-uuid/intelligence');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle no conversation context', async () => {
      const mockIntelligence = {
        overallSentiment: 'neutral',
        keyTopics: [],
        prospectInterestLevel: 'low',
        recommendedNextActions: ['Start the conversation'],
        conversationSummary: 'No conversation recorded yet.',
      };

      (callService.getCallById as jest.Mock).mockResolvedValue(mockCall);
      (llmService.getCallIntelligence as jest.Mock).mockResolvedValue(mockIntelligence);

      const response = await request(app)
        .get(`/calls/${mockCallId}/intelligence`);

      expect(response.status).toBe(200);
      expect(response.body.data.conversationSummary).toBe('No conversation recorded yet.');
    });

    it('should handle invalid API key error', async () => {
      const validCallId = 'cf0a96e3-2c1d-4d0a-bde2-d8e27e31134d';
      (callService.getCallById as jest.Mock).mockResolvedValue(mockCall);
      (llmService.getCallIntelligence as jest.Mock).mockRejectedValue(
        new Error('Invalid Gemini API key. Please check your configuration.')
      );

      const response = await request(app)
        .get(`/calls/${validCallId}/intelligence`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
