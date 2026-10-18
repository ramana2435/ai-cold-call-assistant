import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponse } from '../types';

/**
 * Middleware to validate request using express-validator
 */
export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: 'Validation error',
      message: errors.array().map((err) => err.msg).join(', '),
    };

    res.status(400).json(response);
    return;
  }

  next();
}
