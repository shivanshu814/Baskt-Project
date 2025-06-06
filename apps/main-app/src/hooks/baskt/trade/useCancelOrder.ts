import { useState } from 'react';
import { BN } from 'bn.js';
import { useBasktClient } from '@baskt/ui';
import { useToast } from '../../../components/ui/use-toast';
import { PublicKey } from '@solana/web3.js';

export const useCancelOrder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { client } = useBasktClient();
  const { toast } = useToast();
  const cancelOrder = async ({
    orderPDA,
    orderIdNum,
    ownerTokenAccount,
  }: {
    orderPDA: string;
    orderIdNum: string;
    ownerTokenAccount: string | undefined;
  }) => {
    if (!client) {
      toast({
        title: 'Error',
        description: 'Client not initialized',
        variant: 'destructive',
      });
      return false;
    }
    if (!ownerTokenAccount) {
      toast({
        title: 'Error',
        description: 'User USDC account not found',
        variant: 'destructive',
      });
      return false;
    }
    try {
      setIsLoading(true);
      await client.cancelOrderTx(
        new PublicKey(orderPDA),
        new BN(orderIdNum),
        new PublicKey(ownerTokenAccount),
      );
      toast({
        title: 'Order Cancelled',
        description: 'Your order has been cancelled successfully.',
      });
      return true;
      // eslint-disable-next-line
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel order',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { cancelOrder, isLoading };
};
