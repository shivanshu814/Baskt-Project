import { router } from '../../trpc/trpc';
import { getRouter } from './query';

export const feeEventRouter = router({
  ...getRouter,
});
export type FeeEventRouter = typeof feeEventRouter; 