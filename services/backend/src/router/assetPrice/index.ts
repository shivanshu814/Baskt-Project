import { router } from '../../trpc/trpc';
import { getRouter } from './query';

export const assetPriceRouter = router({
  ...getRouter,
});
export type AssetPriceRouter = typeof assetPriceRouter;
