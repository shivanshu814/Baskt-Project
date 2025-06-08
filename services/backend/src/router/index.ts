/** @format */

import { router, publicProcedure } from '../trpc/trpc';
import { assetRouter } from './assetRouter';
import { basktRouter } from './basktRouter';
import { cryptoRouter } from './cryptoRouter';
import { imageRouter } from './imageRouter';
import { assetPriceRouter } from './assetPrice';
import { poolRouter } from './poolRouter';
import { orderRouter } from './orderRouter';
import { positionRouter } from './positionRouter';
export const appRouter = router({
  health: publicProcedure.query(() => {
    return {
      status: 'ok',
      message: 'Server is running',
    };
  }),
  asset: assetRouter,
  baskt: basktRouter,
  crypto: cryptoRouter,
  image: imageRouter,
  assetPrice: assetPriceRouter,
  pool: poolRouter,
  order: orderRouter,
  position: positionRouter,
});

export type AppRouter = typeof appRouter;
