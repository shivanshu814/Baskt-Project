import { useMemo } from 'react';
import { Order } from '../../../types/trading/orders';
import {
  formatOrderType,
  formatPositionType,
  getPositionTypeColor,
} from '../../../utils/formatters/formatters';

export function useOrdersTable(orders: Order[]) {
  const processedOrders = useMemo(() => {
    return orders.map((order) => {
      const orderTime = order.createdAt ? new Date(order.createdAt) : new Date();
      const orderType = formatOrderType(order);
      const orderSize = order.size || 0;
      const orderPrice = order.price || 0;
      const orderCollateral = order.collateral || orderSize;
      const limitPrice = order.orderType?.limit?.price || orderPrice;

      return {
        order,
        orderTime,
        orderType,
        orderSize,
        orderPrice,
        orderCollateral,
        limitPrice,
        positionType: formatPositionType(order.isLong),
        positionColor: getPositionTypeColor(order.isLong),
      };
    });
  }, [orders]);

  const hasOrders = useMemo(() => {
    return orders.length > 0;
  }, [orders]);

  return {
    processedOrders,
    hasOrders,
    totalOrders: orders.length,
  };
}
