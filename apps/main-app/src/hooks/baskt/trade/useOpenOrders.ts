import { OnchainOrder, OrderStatus } from '@baskt/types';
import { trpc } from '../../../utils/trpc';
import { useBasktClient } from '@baskt/ui';
import { BN } from 'bn.js';
import { useUSDCBalance } from '../../../hooks/pool/useUSDCBalance';

export function useOpenOrders(basktId?: string, userAddress?: string) {
  const { client } = useBasktClient();
  const { account: userUSDCAccount } = useUSDCBalance();
  const cancelOrder = async (order: OnchainOrder) => {
    if (!client || !userUSDCAccount?.address) return;
    await client.cancelOrderTx(order.address, new BN(order.orderId), userUSDCAccount.address);
  };

  const ordersByBasktAndUserQuery = trpc.order.getOrdersByBasktAndUser.useQuery(
    { basktId: basktId || '', userId: userAddress || '' },
    {
      // Only enable the query when we have both basktId and userAddress
      enabled: !!basktId && !!userAddress,
    },
  );

  let orders = (ordersByBasktAndUserQuery.data as any)?.data;

  if (!orders) {
    return {
      orders: [],
      isLoading: false,
      isError: false,
      error: null,
      cancelOrder,
    };
  }

  orders = orders.filter((order: OnchainOrder) => order.status === OrderStatus.PENDING);

  return {
    orders,
    isLoading: ordersByBasktAndUserQuery.isLoading,
    isError: ordersByBasktAndUserQuery.isError,
    error: ordersByBasktAndUserQuery.error,
    cancelOrder,
  };
}
