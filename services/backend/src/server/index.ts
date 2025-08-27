/** @format */
import dotenv from 'dotenv';
dotenv.config();

import * as trpcExpress from '@trpc/server/adapters/express';
import cors from 'cors';
import express from 'express';
import { verifyPrivyJWT } from '../middleware/auth';
import { appRouter } from '../router';
import { Context } from '../trpc/trpc';
import { initializeQuerier, shutdownQuerier } from '../utils';
import { initializeDataBus, shutdownDataBus } from '../utils/databus';
import logger from '../utils/logger';

const app = express();
const port = process.env.PORT || 4000;

Promise.all([initializeQuerier(), initializeDataBus()]).catch((error) => {
  logger.error('Failed to initialize services:', error);
});

app.use(cors());
app.use(express.json());

const createContext = async (opts: trpcExpress.CreateExpressContextOptions): Promise<Context> => {
  const { req } = opts;

  return {
    user: req.user,
    headers: req.headers,
  };
};

app.use(
  '/trpc',
  verifyPrivyJWT,
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const server = app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
  logger.info(`tRPC endpoint: http://localhost:${port}/trpc`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(async () => {
    logger.info('Process terminated');
    await Promise.all([shutdownQuerier(), shutdownDataBus()]);
  });
});
