import { router } from '../../trpc/trpc';
import { getOrders } from './query';

export const orderRouter = router({
  getOrders,
});
