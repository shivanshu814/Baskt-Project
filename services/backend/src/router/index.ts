/** @format */

import { router, publicProcedure } from '../trpc/trpc';
import { assetRouter } from './asset';
import { basktRouter } from './baskt';
import { assetPriceRouter } from './assetPrice';
import { poolRouter } from './pool';
import { orderRouter } from './order';
import { positionRouter } from './position';
import { metricsRouter } from './metrics';
import { historyRouter } from './history';
import { accessRouter } from './access';
import { faucetRouter } from './faucet';

export const appRouter = router({
  health: publicProcedure.query(() => {
    return {
      status: 'ok',
      message: 'Server is running',
    };
  }),
  asset: assetRouter,
  baskt: basktRouter,
  assetPrice: assetPriceRouter,
  pool: poolRouter,
  order: orderRouter,
  position: positionRouter,
  metrics: metricsRouter,
  history: historyRouter,
  accessCode: accessRouter,
  faucet: faucetRouter,
});

export type AppRouter = typeof appRouter;
