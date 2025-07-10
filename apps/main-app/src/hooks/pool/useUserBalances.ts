import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useBasktClient, USDC_MINT, PRICE_PRECISION } from '@baskt/ui';
import { toast } from 'sonner';
import { UseUserBalancesProps } from '../../types/pool';

export const useUserBalances = ({ poolData }: UseUserBalancesProps) => {
  const { client, wallet } = useBasktClient();
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

      setUsdcBalance((Number(usdcBalanceBN.value.amount) / PRICE_PRECISION).toFixed(2));
      setLpBalance((Number(lpBalanceBN.value.amount) / PRICE_PRECISION).toFixed(2));
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('TokenAccountNotFoundError')) {
          setUsdcBalance('0.00');
          setLpBalance('0.00');
        } else {
          toast.error('Failed to fetch balances');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [client, wallet, poolData]);

  // Listen for external transaction events
  useEffect(() => {
    const handleExternalTransaction = () => {
      // Immediate fetch for manual refresh
      fetchBalances();
    };

    // Listen for various transaction events that might affect balance
    window.addEventListener('external-transaction', handleExternalTransaction);
    window.addEventListener('token-received', handleExternalTransaction);
    window.addEventListener('balance-updated', handleExternalTransaction);

    return () => {
      window.removeEventListener('external-transaction', handleExternalTransaction);
      window.removeEventListener('token-received', handleExternalTransaction);
      window.removeEventListener('balance-updated', handleExternalTransaction);
    };
  }, [fetchBalances]);

  useEffect(() => {
    fetchBalances();

    // Set up automatic refresh every 10 seconds for faster updates
    const interval = setInterval(() => {
      fetchBalances();
    }, 10 * 1000);

    return () => clearInterval(interval);
  }, [fetchBalances]);

  return {
    usdcBalance,
    lpBalance,
    isLoading,
    fetchBalances,
  };
};
