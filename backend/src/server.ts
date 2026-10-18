import { createApp } from './app';
import config, { validateConfig } from './config';

/**
 * Start the server
 */
function startServer(): void {
  const app = createApp();

  // Validate configuration
  const configValidation = validateConfig();
  if (!configValidation.valid) {
    console.warn('⚠️  Configuration warnings:');
    configValidation.errors.forEach((error) => {
      console.warn(`   - ${error}`);
    });
    console.warn('⚠️  Server will start in degraded mode');
    console.warn('⚠️  Database operations will fail until Supabase is configured\n');
  }

  // Start listening
  app.listen(config.port, () => {
    console.log('='.repeat(60));
    console.log('🚀 AI Cold-Call Assistant Backend');
    console.log('='.repeat(60));
    console.log(`📡 Server running on port ${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`🔗 Health check: http://localhost:${config.port}/health`);
    console.log(`📊 API base URL: http://localhost:${config.port}`);
    console.log('='.repeat(60));
  });
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
