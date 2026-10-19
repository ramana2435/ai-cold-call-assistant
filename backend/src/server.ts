// Load Windows certificate store for HTTPS requests
// This fixes "unable to verify the first certificate" errors on Windows
try {
  require('win-ca')({ fallback: true, inject: '+' });
} catch (e) {
  // win-ca not available or not on Windows - continue without it
}

import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { createApp } from './app';
import config, { validateConfig } from './config';
import { setupWebSocketServer, cleanupWebSocketConnections } from './services/websocketHandler';

/**
 * Start the server with WebSocket support
 */
function startServer(): void {
  const app = createApp();
  
  // Create HTTP server
  const server = createServer(app);
  
  // Create WebSocket server (no path restriction - handler validates specific paths)
  const wss = new WebSocketServer({ server });
  
  // Setup WebSocket handlers
  setupWebSocketServer(wss);

  // Debug: Log all upgrade requests to diagnose connection issues
  server.on('upgrade', (req) => {
    console.log('[HTTP] Upgrade request received:', req.url);
    console.log('[HTTP] Headers:', {
      upgrade: req.headers.upgrade,
      connection: req.headers.connection,
      origin: req.headers.origin,
    });
  });

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
  server.listen(config.port, () => {
    console.log('='.repeat(60));
    console.log('🚀 AI Cold-Call Assistant Backend');
    console.log('='.repeat(60));
    console.log(`📡 Server running on port ${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`🔗 Health check: http://localhost:${config.port}/health`);
    console.log(`📊 API base URL: http://localhost:${config.port}`);
    console.log(`🎙️  WebSocket: ws://localhost:${config.port}/ws`);
    console.log('='.repeat(60));
  });
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await cleanupWebSocketConnections();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    await cleanupWebSocketConnections();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
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
