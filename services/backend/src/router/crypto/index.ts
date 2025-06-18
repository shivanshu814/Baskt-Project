import { router } from '../../trpc/trpc';
import { getRouter } from './query';

export const cryptoRouter = router({
  ...getRouter,
});
export type CryptoRouter = typeof cryptoRouter;
