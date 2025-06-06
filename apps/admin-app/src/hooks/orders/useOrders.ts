import { useQuery } from '@tanstack/react-query';
import { useBasktClient } from '@baskt/ui';
import { Order } from '../../types/orders';

export const useOrders = () => {
  const { client } = useBasktClient();

  const {
    data: orders,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      if (!client) throw new Error('Client not initialized');
      const rawOrders = await client.getAllOrdersRaw();

      return rawOrders.map((order) => ({
        owner: order.account.owner.toString(),
        orderId: order.account.orderId.toString(),
        basktId: order.account.basktId.toString(),
        size: order.account.size.toNumber() / 1e6,
        collateral: order.account.collateral.toNumber() / 1e6,
        isLong: order.account.isLong,
        action: 'open' in order.account.action ? 'Open' : ('Close' as const),
        status:
          'pending' in order.account.status
            ? 'Pending'
            : 'filled' in order.account.status
            ? 'Filled'
            : ('Cancelled' as const),
        timestamp: order.account.timestamp.toNumber(),
        targetPosition: order.account.targetPosition?.toString(),
      })) as Order[];
    },
    enabled: !!client,
  });

  return {
    orders,
    isLoading,
    error,
  };
};
