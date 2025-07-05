import { OrderStatus } from '@baskt/types';
import { trpc } from '../../../utils/trpc';
import { useBasktClient } from '@baskt/ui';
import { BN } from 'bn.js';
import { useUSDCBalance } from '../../../hooks/pool/useUSDCBalance';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { parseSolanaError } from '../../../utils/error-handling';

export function useOpenOrders(basktId?: string, userAddress?: string) {
  const { client } = useBasktClient();
  const { account: userUSDCAccount, refetch: refetchUSDCBalance } = useUSDCBalance();

  const ordersByBasktAndUserQuery = trpc.order.getOrders.useQuery(
    { basktId: basktId || undefined, userId: userAddress || undefined },
    {
      enabled: !!basktId && !!userAddress,
      refetchInterval: 30 * 1000,
    },
  );

  // Listen for blockchain interaction events
  useEffect(() => {
    const handleBlockchainInteraction = () => {
      ordersByBasktAndUserQuery.refetch();
    };

    // Listen for various blockchain interaction events
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
  }, [ordersByBasktAndUserQuery]);

  // eslint-disable-next-line
  const cancelOrder = async (order: any) => {
    if (!client || !userUSDCAccount?.address) {
      toast.error('Missing required parameters for canceling order');
      return;
    }

    try {
      const tx = await client.cancelOrderTx(
        order.orderPDA,
        new BN(order.orderId),
        userUSDCAccount.address,
      );

      // Wait for transaction confirmation
      const confirmation = await client.connection.confirmTransaction(tx);

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      // Refetch data after successful transaction
      await Promise.all([refetchUSDCBalance(), ordersByBasktAndUserQuery.refetch()]);

      // Dispatch event for other components to listen to
      window.dispatchEvent(new Event('order-cancelled'));

      toast.success('Order canceled successfully');
    } catch (error) {
      const parsedError = parseSolanaError(error);
      toast.error(parsedError.message);
    }
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

  // eslint-disable-next-line
  orders = orders.filter((order: any) => order.status === OrderStatus.PENDING);

  return {
    orders,
    isLoading: ordersByBasktAndUserQuery.isLoading,
    isError: ordersByBasktAndUserQuery.isError,
    error: ordersByBasktAndUserQuery.error,
    cancelOrder,
  };
}
