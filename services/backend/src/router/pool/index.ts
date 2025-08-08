import { router } from '../../trpc/trpc';
import { getRouter } from './query';
import * as withdrawQueueRouter from './withdraw-queue';

export const poolRouter = router({
  ...getRouter,
  ...withdrawQueueRouter,
});
export type PoolRouter = typeof poolRouter;
