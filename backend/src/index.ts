/** @format */

import express from 'express';
import cors from 'cors';
import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { BaseClient } from '@baskt/sdk';

const t = initTRPC.create();

const appRouter = t.router({
  hello: t.procedure.input(z.object({ name: z.string() })).query(({ input }) => {
    return `Hello ${input.name}!`;
  }),
});

export type AppRouter = typeof appRouter;

const app = express();
app.use(cors());
app.use(express.json());

app.use('/trpc', (_req, res) => {
  // tRPC handler will be implemented here
  res.json({ message: 'tRPC endpoint' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
