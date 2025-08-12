import { OnchainOrderStatus } from '@baskt/types';
import { useEffect, useMemo } from 'react';
import { trpc } from '../../lib/api/trpc';

function processDashboardOrder(order: any, baskt: any) {
  const orderTime = order.createdAt ? new Date(order.createdAt) : new Date();
  const orderType = order.orderType?.market ? 'Market' : 'Limit';
  const orderSize = order.size || 0;
  const orderPrice = order.price || baskt?.price || 0;
  const orderCollateral = order.collateral || orderSize;
  const limitPrice = order.orderType?.limit?.price || orderPrice;
  const isLong = order.isLong || false;

  return {
    orderTime,
    orderType,
    orderSize,
    orderPrice,
    orderCollateral,
    limitPrice,
    isLong,
  };
}

export function usePortfolioOrders(userAddress?: string) {
  const ordersQuery = trpc.order.getOrders.useQuery(
    { userId: userAddress || undefined },
    {
      enabled: !!userAddress,
      refetchInterval: 30 * 1000,
    },
  );

  const basktsQuery = trpc.baskt.getAllBaskts.useQuery(
    { withPerformance: true },
    {
      refetchInterval: 30 * 1000,
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

    const pendingOrders = orders.filter(
      (order: any) => order.status === OnchainOrderStatus.PENDING,
    );

    const validBaskts = baskts.filter((b: any) => b && b.basktId);

    return pendingOrders
      .map((order: any) => {
        if (!order || !order.basktId) {
          return null;
        }

        const baskt = validBaskts.find((b: any) => b.basktId === order.basktId);

        if (baskt && baskt.name && baskt.name.trim() !== '') {
          const processedOrder = processDashboardOrder(order, baskt);
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
  }, [ordersQuery.data, basktsQuery.data]);

  return {
    orders: processedOrders,
    isLoading: ordersQuery.isLoading || basktsQuery.isLoading,
    isError: ordersQuery.isError || basktsQuery.isError,
    error: ordersQuery.error || basktsQuery.error,
  };
}
