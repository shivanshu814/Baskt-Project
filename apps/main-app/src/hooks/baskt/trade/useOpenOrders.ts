import { OnchainOrder, OrderStatus } from '@baskt/types';
import { trpc } from '../../../utils/trpc';
import { useBasktClient } from '@baskt/ui';
import { BN } from 'bn.js';
import { useUSDCBalance } from '../../../hooks/pool/useUSDCBalance';

export function useOpenOrders(basktId?: string, userAddress?: string) {
  const { client } = useBasktClient();
  const { account: userUSDCAccount, refetch: refetchUSDCBalance } = useUSDCBalance();

  const ordersByBasktAndUserQuery = trpc.order.getOrdersByBasktAndUser.useQuery(
    { basktId: basktId || '', userId: userAddress || '' },
    {
      enabled: !!basktId && !!userAddress,
      refetchInterval: 30 * 1000,
    },
  );

  const cancelOrder = async (order: OnchainOrder) => {
    if (!client || !userUSDCAccount?.address) return;
    await client.cancelOrderTx(order.address, new BN(order.orderId), userUSDCAccount.address);
    refetchUSDCBalance();
    ordersByBasktAndUserQuery.refetch();
  };

  let orders = (ordersByBasktAndUserQuery.data as any)?.data; //eslint-disable-line

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
