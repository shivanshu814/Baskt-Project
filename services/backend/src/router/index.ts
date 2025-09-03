/** @format */

import { publicProcedure, router } from '../trpc/trpc';
import { accessRouter } from './access';
import { assetRouter } from './asset';
import { assetPriceRouter } from './assetPrice';
import { basktRouter } from './baskt';
import { faucetRouter } from './faucet';
import { feeEventRouter } from './feeEvent';
import { historyRouter } from './history';
import { metricsRouter } from './metrics';
import { orderRouter } from './order';
import { poolRouter } from './pool';
import { portfolioRouter } from './portfolio';
import { positionRouter } from './position';
import { referralRouter } from './referral';
import { vaultRouter } from './vault';

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
  feeEvent: feeEventRouter,
  portfolio: portfolioRouter,
  referral: referralRouter,
  vault: vaultRouter,
});

export type AppRouter = typeof appRouter;
