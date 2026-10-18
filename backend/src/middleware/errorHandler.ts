import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  const response: ApiResponse = {
    success: false,
    error: err.message || 'Internal server error',
  };

  // Determine status code based on error type
  let statusCode = 500;

  if (err.message.includes('not found') || err.message.includes('Not found')) {
    statusCode = 404;
  } else if (
    err.message.includes('required') ||
    err.message.includes('Invalid') ||
    err.message.includes('must be')
  ) {
    statusCode = 400;
  } else if (err.message.includes('already closed')) {
    statusCode = 409; // Conflict
  }

  res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(_req: Request, res: Response): void {
  const response: ApiResponse = {
    success: false,
    error: 'Route not found',
  };

  res.status(404).json(response);
}
