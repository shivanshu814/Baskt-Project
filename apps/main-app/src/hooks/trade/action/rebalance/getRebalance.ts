import { BasktInfo } from '@baskt/types';
import { useBasktClient } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import { useState } from 'react';
import { toast } from 'sonner';

export const useGetRebalance = () => {
  const [isRebalancing, setIsRebalancing] = useState(false);
  const { client } = useBasktClient();

  const rebalanceBaskt = async (baskt: BasktInfo) => {
    if (!client || !baskt.basktId) {
      toast.error('Client not available or baskt ID missing');
      throw new Error('Client not available or baskt ID missing');
    }

    setIsRebalancing(true);
    const toastId = toast.loading('Rebalancing baskt...');

    try {
      const txSignature = await client.rebalanceRequest(new PublicKey(baskt.basktId));
      toast.success('Rebalance successful', { id: toastId });
      return {
        success: true,
        txSignature,
      };
    } catch (error) {
      console.error('Rebalance failed:', error);
      toast.error('Rebalance failed', { id: toastId });
      throw error;
    } finally {
      setIsRebalancing(false);
    }
  };

  return {
    rebalanceBaskt,
    isRebalancing,
  };
};
