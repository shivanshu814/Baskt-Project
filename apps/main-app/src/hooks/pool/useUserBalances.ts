import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useBasktClient, USDC_MINT } from '@baskt/ui';
import { useToast } from '../common/use-toast';
import { UseUserBalancesProps } from '../../types/pool';

export const useUserBalances = ({ poolData }: UseUserBalancesProps) => {
  const { client, wallet } = useBasktClient();
  const { toast } = useToast();
  const [usdcBalance, setUsdcBalance] = useState<string>('0.00');
  const [lpBalance, setLpBalance] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!client || !wallet?.address || !poolData) return;

    try {
      setIsLoading(true);
      const userTokenAccount = await client.getUserTokenAccount(
        new PublicKey(wallet.address),
        USDC_MINT,
      );
      const userLpAccount = await client.getUserTokenAccount(
        new PublicKey(wallet.address),
        new PublicKey(poolData.lpMint),
      );

      const usdcBalanceBN = await client.connection.getTokenAccountBalance(
        userTokenAccount.address,
      );
      const lpBalanceBN = await client.connection.getTokenAccountBalance(userLpAccount.address);

      setUsdcBalance((Number(usdcBalanceBN.value.amount) / 1e6).toFixed(2));
      setLpBalance((Number(lpBalanceBN.value.amount) / 1e6).toFixed(2));
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('TokenAccountNotFoundError')) {
          setUsdcBalance('0.00');
          setLpBalance('0.00');
        } else {
          toast({
            title: 'Failed to fetch balances',
            variant: 'destructive',
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [client, wallet, poolData, toast]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    usdcBalance,
    lpBalance,
    isLoading,
    fetchBalances,
  };
};
