import { router } from '../../trpc/trpc';
import { getOrders } from './query';
import { createOrder, updateOrderStatus } from './mutation';

export const orderRouter = router({
  getOrders,
  createOrder,
  updateOrderStatus,
});
