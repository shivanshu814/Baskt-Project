import { useBasktClient } from '@baskt/ui';
import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { useState } from 'react';
import { toast } from 'sonner';

export const useCancelOrder = (order: any, onClose: () => void) => {
  const { client } = useBasktClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async () => {
    if (!client) {
      toast.error('Wallet not connected');
      return;
    }

    if (!order) {
      toast.error('No order selected');
      return;
    }

    if (!order.orderPDA) {
      toast.error('Invalid order: missing order PDA');
      return;
    }

    if (!order.orderId) {
      toast.error('Invalid order: missing order ID');
      return;
    }

    setIsLoading(true);
    try {
      const toastId = toast.loading('Cancelling order...');
      const userUSDCAccount = await client.getUSDCAccount(client.getPublicKey());
      const orderIdBN =
        typeof order.orderId === 'string' ? new BN(order.orderId) : new BN(order.orderId);

      await client.cancelOrderTx(new PublicKey(order.orderPDA), orderIdBN, userUSDCAccount.address);

      toast.dismiss(toastId);
      toast.success('Order cancelled successfully');
      onClose();
    } catch (error: any) {
      if (error?.message?.includes('insufficient')) {
        toast.error('Insufficient balance for this transaction');
      } else if (error?.message?.includes('order')) {
        toast.error('Order not found or invalid');
      } else if (error?.message?.includes('network')) {
        toast.error('Network error. Please try again');
      } else {
        toast.error('Failed to cancel order. Please try again');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleCancel };
};
