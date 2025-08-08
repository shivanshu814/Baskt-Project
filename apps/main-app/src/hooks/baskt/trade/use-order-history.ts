import { useEffect, useMemo } from 'react';
import { trpc } from '../../../lib/api/trpc';

function processOrderHistory(order: any, baskt?: any) {
  const orderTime = order.createdAt ? new Date(order.createdAt) : new Date();
  const orderType = order.orderType?.market ? 'Market' : 'Limit';
  const orderSize = order.size || 0;
  const orderPrice = order.price || baskt?.price || 0;

  const adjustedSize = order.status === 'FILLED' ? orderSize / 100 : orderSize;
  const filledAmount = order.status === 'FILLED' ? order.filledAmount || adjustedSize : 0;
  const fees = filledAmount > 0 ? ((filledAmount * orderPrice) / 1e6) * 0.002 : 0;
  const status = order.status || 'Filled';
  const transactionHash = order.transactionHash || order.orderId;
  const isLong = order.isLong || false;

  return {
    orderTime,
    orderType,
    orderSize: adjustedSize,
    orderPrice,
    filledAmount,
    fees,
    status,
    transactionHash,
    isLong,
  };
}

export function useOrderHistory(
  basktId?: string,
  userAddress?: string,
  options?: {
    includeBasktInfo?: boolean;
    filterByStatus?: boolean;
    statusFilter?: string;
  },
) {
  const { includeBasktInfo = false, filterByStatus = false, statusFilter } = options || {};

  const ordersQuery = trpc.order.getOrders.useQuery(
    {
      basktId: basktId || undefined,
      userId: userAddress || undefined,
    },
    {
      enabled: !!userAddress && (!!basktId || !basktId),
      refetchInterval: 30 * 1000,
    },
  );

  const basktsQuery = trpc.baskt.getAllBaskts.useQuery(
    { withPerformance: true },
    {
      refetchInterval: 30 * 1000,
      enabled: includeBasktInfo,
    },
  );

  useEffect(() => {
    const handleBlockchainInteraction = () => {
      ordersQuery.refetch();
    };

    window.addEventListener('order-cancelled', handleBlockchainInteraction);
    window.addEventListener('order-created', handleBlockchainInteraction);
    window.addEventListener('position-opened', handleBlockchainInteraction);
    window.addEventListener('position-closed', handleBlockchainInteraction);
    window.addEventListener('collateral-added', handleBlockchainInteraction);

    return () => {
      window.removeEventListener('order-cancelled', handleBlockchainInteraction);
      window.removeEventListener('order-created', handleBlockchainInteraction);
      window.removeEventListener('position-opened', handleBlockchainInteraction);
      window.removeEventListener('position-closed', handleBlockchainInteraction);
      window.removeEventListener('collateral-added', handleBlockchainInteraction);
    };
  }, [ordersQuery]);

  const processedOrders = useMemo(() => {
    const orders = (ordersQuery.data as any)?.data || [];
    const baskts = (basktsQuery.data as any)?.data || [];

    let filteredOrders = orders;

    if (filterByStatus && statusFilter) {
      filteredOrders = orders.filter((order: any) => order.status === statusFilter);
    }

    if (includeBasktInfo) {
      return filteredOrders
        .map((order: any) => {
          const baskt = baskts.find((b: any) => b.basktId === order.basktId);

          if (baskt && baskt.name && baskt.name.trim() !== '') {
            const processedOrder = processOrderHistory(order, baskt);
            return {
              ...processedOrder,
              basktName: baskt.name,
              basktId: order.basktId,
            };
          } else {
            return null;
          }
        })
        .filter((order: any) => order !== null);
    } else {
      return filteredOrders.map((order: any) => processOrderHistory(order));
    }
  }, [ordersQuery.data, basktsQuery.data, filterByStatus, statusFilter, includeBasktInfo]);

  const hasOrders = useMemo(() => {
    return processedOrders.length > 0;
  }, [processedOrders]);

  return {
    orders: processedOrders,
    hasOrders,
    totalOrders: processedOrders.length,
    isLoading: ordersQuery.isLoading || (includeBasktInfo && basktsQuery.isLoading),
    isError: ordersQuery.isError || (includeBasktInfo && basktsQuery.isError),
    error: ordersQuery.error || basktsQuery.error,
  };
}
