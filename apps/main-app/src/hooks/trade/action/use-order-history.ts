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
  const status = order.orderStatus || 'Filled';
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
    isPortfolio?: boolean;
  },
) {
  const {
    includeBasktInfo = false,
    filterByStatus = false,
    statusFilter,
    isPortfolio = false,
  } = options || {};

  const shouldIncludeBasktInfo = includeBasktInfo || isPortfolio;
  const effectiveBasktId = isPortfolio ? undefined : basktId;

  const ordersQuery = trpc.order.getOrders.useQuery(
    {
      basktId: effectiveBasktId || undefined,
      userId: userAddress || undefined,
    },
    {
      enabled: !!userAddress && (!!effectiveBasktId || !effectiveBasktId),
      refetchInterval: 30 * 1000,
    },
  );

  const basktsQuery = trpc.baskt.getAllBaskts.useQuery(
    { withPerformance: true },
    {
      refetchInterval: 30 * 1000,
      enabled: shouldIncludeBasktInfo,
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
      filteredOrders = orders.filter((order: any) => order.orderStatus === statusFilter);
    }

    if (shouldIncludeBasktInfo) {
      const validBaskts = baskts.filter((b: any) => b && b.basktId);

      return filteredOrders
        .map((order: any) => {
          if (!order || !order.basktId) {
            return null;
          }

          const baskt = validBaskts.find((b: any) => b.basktId === order.basktId);

          if (baskt && baskt.name && baskt.name.trim() !== '') {
            const processedOrder = processOrderHistory(order, baskt);
            return {
              ...processedOrder,
              basktName: baskt.name,
              basktId: order.basktId,
              orderPDA: order.orderPDA,
              orderId: order.orderId,
            };
          } else {
            return null;
          }
        })
        .filter((order: any) => order !== null);
    } else {
      return filteredOrders.map((order: any) => {
        const processedOrder = processOrderHistory(order);
        return {
          ...processedOrder,
          orderPDA: order.orderPDA,
          orderId: order.orderId,
        };
      });
    }
  }, [ordersQuery.data, basktsQuery.data, filterByStatus, statusFilter, shouldIncludeBasktInfo]);

  const hasOrders = useMemo(() => {
    return processedOrders.length > 0;
  }, [processedOrders]);

  return {
    orders: processedOrders,
    hasOrders,
    totalOrders: processedOrders.length,
    isLoading: ordersQuery.isLoading || (shouldIncludeBasktInfo && basktsQuery.isLoading),
    isError: ordersQuery.isError || (shouldIncludeBasktInfo && basktsQuery.isError),
    error: ordersQuery.error || basktsQuery.error,
  };
}
