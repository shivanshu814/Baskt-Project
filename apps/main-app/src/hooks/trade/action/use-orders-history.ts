import { BasktInfo } from '@baskt/types';
import { useMemo } from 'react';
import { processOrderHistoryDetails } from '../../../utils/formatters/formatters';

export function useOrdersHistory(orders: any[], baskt: BasktInfo) {
  const processedOrders = useMemo(() => {
    const mapped = orders.map((order) => processOrderHistoryDetails(order, baskt));
    return mapped.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [orders, baskt]);

  const hasOrders = useMemo(() => {
    return orders.length > 0;
  }, [orders]);

  return {
    processedOrders,
    hasOrders,
    totalOrders: orders.length,
  };
}
