import { OnchainOrderStatus } from '@baskt/types';
import { useMemo } from 'react';
import { trpc } from '../../../../lib/api/trpc';

export function useGetOrders(basktId?: string, userAddress?: string) {
  const ordersQuery = trpc.order.getOrders.useQuery(
    {
      basktId: basktId || undefined,
      userId: userAddress || undefined,
      orderStatus: OnchainOrderStatus.PENDING,
    },
    {
      enabled: !!userAddress,
      refetchInterval: 30 * 1000,
    },
  );

  const orders = (ordersQuery.data as any)?.data || [];

  const processedOrders = useMemo(() => {
    return orders.map((order: any) => ({
      createdAt: order.createdAt,
      orderType: order.orderType,
      orderAction: order.orderAction,
      sizeAsContracts: order.closeParams?.sizeAsContracts,
      collateral: order.openParams?.collateral,
      notionalValue: order.openParams?.notionalValue,
      basktAddress: order.basktAddress,
      orderPDA: order.orderPDA,
      orderId: order.orderId,
      owner: order.owner,
    }));
  }, [orders]);

  return {
    orders: processedOrders,
    loading: ordersQuery.isLoading,
    error: ordersQuery.error,
  };
}
