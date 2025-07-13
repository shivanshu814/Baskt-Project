/** @format */
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from '../router/';
import { initializeQuerier, shutdownQuerier } from '../utils/querier';

const app = express();
const port = process.env.PORT || 4000;

// Initialize querier
initializeQuerier().catch(console.error);

app.use(cors());
app.use(express.json());

app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}),
  }),
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`tRPC endpoint: http://localhost:${port}/trpc`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(async () => {
    console.log('Process terminated');
    await shutdownQuerier();
  });
});
