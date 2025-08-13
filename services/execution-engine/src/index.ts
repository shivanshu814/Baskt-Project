import dotenv from 'dotenv';
dotenv.config(); // Load environment variables first

import express from 'express';
import { config } from './config';
import { ExecutionService } from './execution.service';
import { HealthHandler } from './handlers/health.handler';
import { logger } from '@baskt/data-bus';

async function main() {
  let executionService: ExecutionService;
  
  // Initialize service
  executionService = new ExecutionService(config);
  
  // Initialize clients AFTER env vars are loaded
  const clientModule = await import('./config/client');
  clientModule.initializeClients();
  
  const { querierClient } = clientModule;
  
  // Initialize external dependencies (MongoDB, TimescaleDB, Solana)
  await querierClient.init();
  
  // Start the service
  await executionService.start();

  // Setup Express app for health checks
  const app = express();
  app.use(express.json());

  // Health endpoints
  const healthHandler = new HealthHandler(executionService);
  app.get('/health', (req, res) => healthHandler.getHealth(req, res));
  app.get('/ready', (req, res) => healthHandler.getReadiness(req, res));
  app.get('/live', (req, res) => healthHandler.getLiveness(req, res));

  // Start HTTP server
  const server = app.listen(config.service.port, () => {
    logger.info(`Execution Engine running on port ${config.service.port}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down...`);
    
    server.close(async () => {
      await executionService.stop();
      process.exit(0);
    });

    // Force exit after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Start the service
main().catch((err) => {
  logger.error('Failed to start execution engine', { error: err });
  process.exit(1);
});