import { BasktInfo } from '@baskt/types';
import { useMemo } from 'react';
import { processOrderDetails } from '../../../utils/formatters/formatters';

export function useOpenOrders(orders: any[], baskt: BasktInfo) {
  const processedOrders = useMemo(() => {
    return orders.map((order) => processOrderDetails(order, baskt));
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
