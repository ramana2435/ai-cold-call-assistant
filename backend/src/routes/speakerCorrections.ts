import { Router, Request, Response, NextFunction } from 'express';
import { param, body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { ApiResponse } from '../types';
import {
  saveSpeakerCorrection,
  getSpeakerCorrections,
  getSpeakerCorrectionForSegment,
} from '../services/speakerCorrectionService';

const router = Router();

/**
 * POST /calls/:callId/segments/:segmentId/speaker-correction
 * Save or update a manual speaker correction
 */
router.post(
  '/:callId/segments/:segmentId/speaker-correction',
  [
    param('callId').isUUID().withMessage('Invalid call ID format'),
    param('segmentId').isUUID().withMessage('Invalid segment ID format'),
    body('corrected_speaker')
      .isIn(['salesperson', 'prospect', 'unknown'])
      .withMessage('Speaker must be salesperson, prospect, or unknown'),
    body('correction_reason').optional().isString().withMessage('Reason must be a string'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { callId, segmentId } = req.params;
      const { corrected_speaker, correction_reason } = req.body;

      const correction = await saveSpeakerCorrection(
        callId,
        segmentId,
        corrected_speaker,
        correction_reason
      );

      const response: ApiResponse = {
        success: true,
        data: correction,
        message: 'Speaker correction saved',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /calls/:callId/speaker-corrections
 * Get all speaker corrections for a call
 */
router.get(
  '/:callId/speaker-corrections',
  [param('callId').isUUID().withMessage('Invalid call ID format')],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { callId } = req.params;
      const corrections = await getSpeakerCorrections(callId);

      const response: ApiResponse = {
        success: true,
        data: corrections,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /calls/:callId/segments/:segmentId/speaker-correction
 * Get speaker correction for a specific segment
 */
router.get(
  '/:callId/segments/:segmentId/speaker-correction',
  [
    param('callId').isUUID().withMessage('Invalid call ID format'),
    param('segmentId').isUUID().withMessage('Invalid segment ID format'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { segmentId } = req.params;
      const correction = await getSpeakerCorrectionForSegment(segmentId);

      const response: ApiResponse = {
        success: true,
        data: correction,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
