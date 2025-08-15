import { BasktInfo, OnchainOrderStatus } from '@baskt/types';
import { useMemo } from 'react';
import { processOrderDetails } from '../../../utils/formatters/formatters';
import { useOrderHistory } from './use-order-history';

export function useOpenOrders(basktId?: string, userAddress?: string, baskt?: BasktInfo) {
  const { orders = [] } = useOrderHistory(basktId, userAddress, {
    includeBasktInfo: false,
    filterByStatus: true,
    statusFilter: OnchainOrderStatus.PENDING,
  });

  const processedOrders = useMemo(() => {
    if (!baskt) return [];
    return orders.map((order: any) => {
      const processedOrder = processOrderDetails(order, baskt);
      return {
        ...processedOrder,
        orderPDA: order.orderPDA,
        orderId: order.orderId,
      };
    });
  }, [orders, baskt]);

  const hasOrders = useMemo(() => {
    return orders.length > 0;
  }, [orders]);

  return {
    orders,
    processedOrders,
    hasOrders,
    totalOrders: orders.length,
  };
}
