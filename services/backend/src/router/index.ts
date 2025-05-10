/** @format */

import { router, publicProcedure } from '../trpc/trpc';
import { assetRouter } from './assetRouter';
import { basktRouter } from './basktRouter';
import { cryptoRouter } from './cryptoRouter';
import { imageRouter } from './imageRouter';

export const appRouter = router({
  // health check
  health: publicProcedure.query(() => {
    return {
      status: 'ok',
      message: 'Server is running',
    };
  }),

  // asset router
  asset: assetRouter,

  // baskt router
  baskt: basktRouter,

  // crypto router
  crypto: cryptoRouter,

  // image router
  image: imageRouter,
});

export type AppRouter = typeof appRouter;
