import { useQuery } from '@tanstack/react-query';
import { useBasktClient } from '@baskt/ui';

export function useOpenOrders(basktId?: string, userAddress?: string) {
  const { client } = useBasktClient();

  return useQuery({
    queryKey: ['openOrders', basktId, userAddress],
    enabled: !!client && !!basktId && !!userAddress,
    queryFn: async () => {
      if (!client) return [];
      const allOrders = await client.getAllOrdersRaw();

      return allOrders.filter(
        (order) =>
          order.account.basktId.toString() === basktId &&
          order.account.owner.toString() === userAddress &&
          order.account.status.pending,
      );
    },
  });
}
