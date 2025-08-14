import 'dotenv/config';
import express from 'express';
import { GuardianService } from './guardian.service';
import { createHealthRouter } from './handlers/health.handler';
import { querierClient } from './config/client';
import { loadConfig } from './config';
import { logger } from './utils/logger';

async function main() {
  try {
    // Load configuration
    const config = loadConfig();

    // Initialize querier
    await querierClient.init();
    logger.info('Querier initialized');

    // Create and start Guardian service
    const guardian = new GuardianService(config);
    await guardian.start();

    // Setup health endpoints
    // const app = express();
    // app.use(createHealthRouter(guardian));

    // const port = process.env.HEALTH_PORT || 8080;
    // app.listen(port, () => {
    //   logger.info({ port }, 'Health server started');
    // });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Shutdown signal received');
      await guardian.stop();
      await querierClient.shutdown();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error: any) {
    logger.error({ error: error.toString() }, 'Failed to start Guardian');
    process.exit(1);
  }
}

main().catch(console.error);
