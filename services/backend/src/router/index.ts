/** @format */

import { router, publicProcedure } from '../trpc/trpc';
import { assetRouter } from './asset';
import { basktRouter } from './baskt';
import { cryptoRouter } from './crypto';
import { assetPriceRouter } from './assetPrice';
import { poolRouter } from './pool';
import { orderRouter } from './order';
import { positionRouter } from './position';
import { metricsRouter } from './metrics';

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
  assetPrice: assetPriceRouter,
  pool: poolRouter,
  order: orderRouter,
  position: positionRouter,
  metrics: metricsRouter,
});

export type AppRouter = typeof appRouter;
