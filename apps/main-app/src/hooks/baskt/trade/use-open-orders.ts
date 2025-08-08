import { OnchainOrderStatus } from '@baskt/types';
import { useOrderHistory } from './use-order-history';

export function useOpenOrders(basktId?: string, userAddress?: string) {
  return useOrderHistory(basktId, userAddress, {
    includeBasktInfo: false,
    filterByStatus: true,
    statusFilter: OnchainOrderStatus.PENDING,
  });
}
