import { useState, useCallback } from 'react';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { useBasktClient, USDC_MINT } from '@baskt/ui';
import type { UseWithdrawProps } from '../../types/pool';
import { useProtocol } from '../protocol/useProtocol';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useUSDCBalance } from '../pool/useUSDCBalance';
import { toast } from 'sonner';

export const useWithdraw = ({ poolData, liquidityPool, onSuccess }: UseWithdrawProps) => {
  const { client, wallet } = useBasktClient();
  const { protocol } = useProtocol();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const { refetch: refetchUSDCBalance } = useUSDCBalance();

  const isWithdrawValid = Boolean(
    withdrawAmount && !isNaN(Number(withdrawAmount)) && Number(withdrawAmount) > 0,
  );

  const handleWithdraw = useCallback(async () => {
    if (
      !isWithdrawValid ||
      !client ||
      !wallet?.address ||
      !liquidityPool ||
      !poolData ||
      !protocol
    ) {
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
          new PublicKey(poolData.lpMint),
        );
      } catch (error) {
        toast.error('Failed to get LP token account. Please try again.');
        setIsWithdrawing(false);
        return;
      }

      const minUsdcOut = new BN(0);

      const treasuryTokenAccount = await getAssociatedTokenAddressSync(
        new PublicKey(protocol?.escrowMint),
        protocol?.treasury,
      );

      await client.removeLiquidity(
        liquidityPool,
        withdrawAmountBN,
        minUsdcOut,
        userTokenAccount.address,
        new PublicKey(poolData.tokenVault),
        userLpAccount.address,
        new PublicKey(poolData.lpMint),
        treasuryTokenAccount,
        protocol?.treasury,
      );

      refetchUSDCBalance();

      toast.success('Withdrawal successful! Your withdrawal has been processed');
      setWithdrawAmount('');
      onSuccess?.();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Treasury')) {
          toast.error('Treasury account error. Please contact support.');
        } else if (error.message.includes('insufficient funds')) {
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
  }, [client, wallet, liquidityPool, poolData, withdrawAmount, isWithdrawValid, onSuccess]);

  return {
    withdrawAmount,
    setWithdrawAmount,
    isWithdrawing,
    isWithdrawValid,
    handleWithdraw,
  };
};
