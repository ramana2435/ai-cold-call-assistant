import { Router, Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import {
  analyzeTranscript,
  suggestNextStage,
  suggestResponse,
  getCallIntelligence,
} from '../services/llmService';
import { getCallById } from '../services/callService';
import {
  analyzeTranscriptValidators,
  suggestStageValidators,
  suggestResponseValidators,
  getIntelligenceValidators,
} from '../validators';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * POST /calls/:id/analyze
 * Analyze transcript and detect stage
 */
router.post(
  '/:id/analyze',
  analyzeTranscriptValidators,
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const callId = req.params.id;
      
      // Check if call exists
      const call = await getCallById(callId);
      if (!call) {
        const response: ApiResponse = {
          success: false,
          error: 'Call not found',
        };
        res.status(404).json(response);
        return;
      }

      // Get current stage from request or use call's current stage
      const currentStage = req.body.currentStage || call.current_stage_number;
      
      const analysisResult = await analyzeTranscript(
        callId,
        req.body.transcript,
        currentStage
      );

      const response: ApiResponse = {
        success: true,
        data: analysisResult,
        message: 'Transcript analyzed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /calls/:id/suggest-stage
 * Suggest next stage based on conversation
 */
router.post(
  '/:id/suggest-stage',
  suggestStageValidators,
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const callId = req.params.id;
      
      // Check if call exists
      const call = await getCallById(callId);
      if (!call) {
        const response: ApiResponse = {
          success: false,
          error: 'Call not found',
        };
        res.status(404).json(response);
        return;
      }

      const conversationContext = req.body.conversationSummary || '';
      
      const stageRecommendation = await suggestNextStage(
        callId,
        call.current_stage_number,
        conversationContext
      );

      const response: ApiResponse = {
        success: true,
        data: stageRecommendation,
        message: 'Stage recommendation generated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /calls/:id/suggest-response
 * Suggest responses based on prospect's words
 */
router.post(
  '/:id/suggest-response',
  suggestResponseValidators,
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const callId = req.params.id;
      
      // Check if call exists
      const call = await getCallById(callId);
      if (!call) {
        const response: ApiResponse = {
          success: false,
          error: 'Call not found',
        };
        res.status(404).json(response);
        return;
      }

      const suggestedResponse = await suggestResponse(
        callId,
        req.body.prospectLastWords,
        call.current_stage_name
      );

      const response: ApiResponse = {
        success: true,
        data: suggestedResponse,
        message: 'Response suggestions generated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /calls/:id/intelligence
 * Get call intelligence summary
 */
router.get(
  '/:id/intelligence',
  getIntelligenceValidators,
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const callId = req.params.id;
      
      // Check if call exists
      const call = await getCallById(callId);
      if (!call) {
        const response: ApiResponse = {
          success: false,
          error: 'Call not found',
        };
        res.status(404).json(response);
        return;
      }

      const intelligence = await getCallIntelligence(callId);

      const response: ApiResponse = {
        success: true,
        data: intelligence,
        message: 'Call intelligence retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
