import { USDC_MINT, useBasktClient } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { UseWithdrawProps } from '../../../types/vault';

/**
 * Hook to handle withdrawals
 * @param vaultData - The vault data
 * @param liquidityPool - The liquidity pool
 * @param onSuccess - The function to call when the withdrawal is successful
 * @returns The withdraw amount, set withdraw amount, is withdrawing, is withdraw valid, and handle withdraw
 */
export function useWithdraw({ vaultData, liquidityPool, onSuccess }: UseWithdrawProps) {
  const { client, wallet } = useBasktClient();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // check if withdraw amount is valid
  const isWithdrawValid = Boolean(
    withdrawAmount && !isNaN(Number(withdrawAmount)) && Number(withdrawAmount) > 0,
  );

  // handle withdraw
  const handleWithdraw = useCallback(async () => {
    if (!isWithdrawValid || !client || !wallet?.address || !liquidityPool || !vaultData) {
      return;
    }

    try {
      setIsWithdrawing(true);

      const withdrawAmountNum = Number(withdrawAmount);
      if (isNaN(withdrawAmountNum)) {
        toast.error('Invalid withdrawal amount');
        setIsWithdrawing(false);
        return;
      }
      const withdrawAmountBN = new BN(withdrawAmountNum * 1e6);

      const userTokenAccount = await client.getUserTokenAccount(
        new PublicKey(wallet.address),
        USDC_MINT,
      );

      let userLpAccount;
      try {
        userLpAccount = await client.getUserTokenAccount(
          new PublicKey(wallet.address),
          new PublicKey(vaultData.lpMint),
        );
      } catch (error) {
        toast.error('Failed to get LP token account. Please try again.');
        setIsWithdrawing(false);
        return;
      }

      const tx = await client.queueWithdrawLiquidity(
        withdrawAmountBN,
        userTokenAccount.address,
        userLpAccount.address,
        new PublicKey(vaultData.lpMint),
      );

      if (tx) {
        toast.success('Withdrawal queued successfully!');
        setWithdrawAmount('');
        onSuccess?.();
      } else {
        toast.error('Failed to add withdrawal to queue');
      }
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          toast.error('Insufficient LP token balance for withdrawal');
        } else {
          toast.error('Failed to withdraw. Please try again.');
        }
      } else {
        toast.error('Failed to withdraw. Please try again.');
      }
    } finally {
      setIsWithdrawing(false);
    }
  }, [client, wallet, liquidityPool, vaultData, withdrawAmount, isWithdrawValid, onSuccess]);

  return {
    withdrawAmount,
    setWithdrawAmount,
    isWithdrawing,
    isWithdrawValid,
    handleWithdraw,
  };
}
