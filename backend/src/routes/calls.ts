import { Router, Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import {
  createCall,
  getAllCalls,
  getCallWithStages,
  saveStageResult,
  closeCall,
} from '../services/callService';
import {
  createCallValidators,
  saveStageValidators,
  closeCallValidators,
  callIdValidator,
} from '../validators';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * POST /calls
 * Create a new call
 */
router.post(
  '/',
  createCallValidators,
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const call = await createCall(req.body);

      const response: ApiResponse = {
        success: true,
        data: call,
        message: 'Call created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /calls
 * Get all calls (newest first)
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const calls = await getAllCalls();

    const response: ApiResponse = {
      success: true,
      data: calls,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /calls/:id
 * Get call details with stage results
 */
router.get(
  '/:id',
  callIdValidator,
  validateRequest,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const call = await getCallWithStages(req.params.id);

      if (!call) {
        const response: ApiResponse = {
          success: false,
          error: 'Call not found',
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: call,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /calls/:id/stages
 * Save a stage result and update call progress
 */
router.post(
  '/:id/stages',
  saveStageValidators,
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stageResult = await saveStageResult(req.params.id, req.body);

      const response: ApiResponse = {
        success: true,
        data: stageResult,
        message: 'Stage result saved successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /calls/:id/close
 * Close a call from any stage
 */
router.post(
  '/:id/close',
  closeCallValidators,
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const closedCall = await closeCall(req.params.id, req.body);

      const response: ApiResponse = {
        success: true,
        data: closedCall,
        message: 'Call closed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
