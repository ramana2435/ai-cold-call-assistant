import { Router, Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import {
  getTranscriptSegments,
  getFullTranscript,
  validateCallForStreaming,
  storeTranscriptSegment,
} from '../services/speechService';
import { param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * GET /calls/:id/transcript
 * Get transcript segments for a call
 */
router.get(
  '/:id/transcript',
  [param('id').isUUID().withMessage('Invalid call ID format')],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const callId = req.params.id;
      const finalOnly = req.query.final === 'true';

      const segments = await getTranscriptSegments(callId, finalOnly);

      const response: ApiResponse = {
        success: true,
        data: segments,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /calls/:id/transcript/full
 * Get full transcript text (finalized segments only)
 */
router.get(
  '/:id/transcript/full',
  [param('id').isUUID().withMessage('Invalid call ID format')],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const callId = req.params.id;
      const fullText = await getFullTranscript(callId);

      const response: ApiResponse = {
        success: true,
        data: { transcript: fullText },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /calls/:id/transcript/test
 * Store a test transcript segment (for testing without actual streaming)
 */
router.post(
  '/:id/transcript/test',
  [param('id').isUUID().withMessage('Invalid call ID format')],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const callId = req.params.id;
      const { text, is_final = true } = req.body;

      if (!text) {
        const response: ApiResponse = {
          success: false,
          error: 'Text is required',
        };
        res.status(400).json(response);
        return;
      }

      // Verify call exists and is in progress
      const isValid = await validateCallForStreaming(callId);
      if (!isValid) {
        const response: ApiResponse = {
          success: false,
          error: 'Call not found or not in progress',
        };
        res.status(404).json(response);
        return;
      }

      const segment = await storeTranscriptSegment(
        callId,
        text,
        is_final,
        0.95, // Mock confidence
        undefined,
        undefined,
        'salesperson'
      );

      const response: ApiResponse = {
        success: true,
        data: segment,
        message: 'Test transcript segment stored',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
