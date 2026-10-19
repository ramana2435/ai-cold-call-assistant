import express, { Express } from 'express';
import cors from 'cors';
import config from './config';
import healthRouter from './routes/health';
import callsRouter from './routes/calls';
import llmRouter from './routes/llm';
import speechRouter from './routes/speech';
import knowledgeRouter from './routes/knowledge';
import speakerCorrectionsRouter from './routes/speakerCorrections';
import referenceIntelligenceRouter from './routes/referenceIntelligence';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors({
    origin: config.cors.origins,
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging in development
  if (config.nodeEnv === 'development') {
    app.use((req, _res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  // Routes
  app.use('/health', healthRouter);
  app.use('/calls', callsRouter);
  app.use('/calls', llmRouter); // LLM routes under /calls/:id/*
  app.use('/calls', speechRouter); // Speech routes under /calls/:id/transcript/*
  app.use('/calls', speakerCorrectionsRouter); // Speaker correction routes
  app.use('/calls', referenceIntelligenceRouter); // Reference intelligence routes
  app.use('/calls', knowledgeRouter); // Knowledge routes under /calls/:id/knowledge
  app.use('/', knowledgeRouter); // Product and organization profile routes
  app.use('/reference-intelligence', referenceIntelligenceRouter); // Stats and health

  // Error handlers (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
