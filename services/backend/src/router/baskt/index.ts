import { router } from '../../trpc/trpc';
import { getRouter } from './query';
import { mutationRouter } from './mutation';

export const basktRouter = router({
  ...getRouter,
  ...mutationRouter,
});

export type BasktRouter = typeof basktRouter;
