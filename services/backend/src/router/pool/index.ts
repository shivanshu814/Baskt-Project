import { router } from '../../trpc/trpc';
import { getRouter } from './query';

export const poolRouter = router({
  ...getRouter,
});
export type PoolRouter = typeof poolRouter;
