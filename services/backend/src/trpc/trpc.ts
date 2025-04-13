/** @format */

import { initTRPC, TRPCError } from '@trpc/server';

// Do not move. This has to be at the base
import dotenv from 'dotenv';
dotenv.config();

const t = initTRPC.create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof TRPCError ? error.cause : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
