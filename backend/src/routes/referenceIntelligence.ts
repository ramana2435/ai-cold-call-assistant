import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { ApiResponse } from '../types';
import { 
  getRelevantExamples, 
  getReferenceStats, 
  isReferenceDataAvailable 
} from '../services/referenceIntelligenceService';
import { StageName } from '../types';

const router = Router();

const VALID_STAGES = ['Opening', 'Purpose', 'Permission', 'Their business', 'Their need, in their words', 'Objection', 'Next step', 'Close'];

/**
 * POST /calls/:id/reference-intelligence
 * Get relevant reference examples for current call state
 */
router.post(
  '/:id/reference-intelligence',
  [
    param('id').isUUID().withMessage('Invalid call ID format'),
    body('current_stage')
      .isIn(VALID_STAGES)
      .withMessage(`Stage must be one of: ${VALID_STAGES.join(', ')}`),
    body('recent_transcript')
      .optional()
      .isString()
      .withMessage('Recent transcript must be a string'),
    body('requested_outcome')
      .optional()
      .isString()
      .withMessage('Requested outcome must be a string'),
    body('max_examples')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Max examples must be between 1 and 5'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: callId } = req.params;
      const { 
        current_stage, 
        recent_transcript = '', 
        requested_outcome,
        max_examples = 3 
      } = req.body;

      console.log(`[ReferenceIntelligence] Request for call ${callId}, stage: ${current_stage}`);

      // Check if reference data is available
      if (!isReferenceDataAvailable()) {
        const response: ApiResponse = {
          success: false,
          error: 'Reference dataset not available',
        };
        res.status(503).json(response);
        return;
      }

      const intelligence = await getRelevantExamples(
        current_stage as StageName,
        recent_transcript,
        requested_outcome,
        max_examples
      );

      const response: ApiResponse = {
        success: true,
        data: intelligence,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /reference-intelligence/stats
 * Get statistics about the reference dataset
 */
router.get(
  '/stats',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!isReferenceDataAvailable()) {
        const response: ApiResponse = {
          success: false,
          error: 'Reference dataset not available',
        };
        res.status(503).json(response);
        return;
      }

      const stats = getReferenceStats();

      const response: ApiResponse = {
        success: true,
        data: stats,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /reference-intelligence/health
 * Check if reference intelligence service is available
 */
router.get(
  '/health',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const available = isReferenceDataAvailable();
      
      const response: ApiResponse = {
        success: true,
        data: {
          available,
          message: available 
            ? 'Reference intelligence service is operational'
            : 'Reference dataset not found',
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
