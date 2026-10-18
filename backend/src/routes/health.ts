import { Router, Request, Response } from 'express';
import { ApiResponse } from '../types';
import { testDatabaseConnection } from '../db/supabase';
import { validateConfig } from '../config';

const router = Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const configValidation = validateConfig();
    
    // If config is invalid, return degraded health
    if (!configValidation.valid) {
      const response: ApiResponse = {
        success: true,
        data: {
          status: 'degraded',
          message: 'Configuration incomplete',
          errors: configValidation.errors,
          timestamp: new Date().toISOString(),
        },
      };
      res.status(200).json(response);
      return;
    }

    // Test database connection
    const dbTest = await testDatabaseConnection();

    const response: ApiResponse = {
      success: true,
      data: {
        status: dbTest.connected ? 'healthy' : 'degraded',
        database: {
          connected: dbTest.connected,
          error: dbTest.error,
        },
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(503).json(response);
  }
});

export default router;
