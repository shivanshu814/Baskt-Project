import { useState, useCallback } from 'react';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { useBasktClient, USDC_MINT } from '@baskt/ui';
import { useToast } from '../common/use-toast';
import { useTreasuryAccount } from './useTreasuryAccount';
import type { UseWithdrawProps } from '../../types/pool';

export const useWithdraw = ({ poolData, liquidityPool, onSuccess }: UseWithdrawProps) => {
  const { client, wallet } = useBasktClient();
  const { toast } = useToast();
  const { setupTreasuryAccount } = useTreasuryAccount();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const isWithdrawValid = Boolean(
    withdrawAmount && !isNaN(Number(withdrawAmount)) && Number(withdrawAmount) > 0,
  );

  const handleWithdraw = useCallback(async () => {
    if (!isWithdrawValid || !client || !wallet?.address || !liquidityPool || !poolData) {
      return;
    }

    try {
      setIsWithdrawing(true);

      const withdrawAmountNum = Number(withdrawAmount);
      if (isNaN(withdrawAmountNum)) {
        toast({
          title: 'Invalid withdrawal amount',
          variant: 'destructive',
        });
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
        toast({
          title: 'Failed to get LP token account. Please try again.',
          variant: 'destructive',
        });
        setIsWithdrawing(false);
        return;
      }

      const minUsdcOut = new BN(0);
      const treasurySetup = await setupTreasuryAccount(liquidityPool);
      if (!treasurySetup) {
        setIsWithdrawing(false);
        return;
      }

      const { poolAuthority, treasuryTokenAccount } = treasurySetup;

      await client.removeLiquidity(
        liquidityPool,
        withdrawAmountBN,
        minUsdcOut,
        userLpAccount.address,
        new PublicKey(poolData.lpMint),
        userTokenAccount.address,
        new PublicKey(poolData.tokenVault),
        treasuryTokenAccount,
        poolAuthority,
      );

      toast({
        title: 'Withdrawal successful!',
        description: 'Your withdrawal has been processed',
        variant: 'default',
      });
      setWithdrawAmount('');
      onSuccess?.();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Treasury')) {
          toast({
            title: 'Treasury account error. Please contact support.',
            variant: 'destructive',
          });
        } else if (error.message.includes('insufficient funds')) {
          toast({
            title: 'Insufficient LP token balance for withdrawal',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Failed to withdraw. Please try again.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Failed to withdraw. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsWithdrawing(false);
    }
  }, [
    client,
    wallet,
    liquidityPool,
    poolData,
    withdrawAmount,
    isWithdrawValid,
    onSuccess,
    toast,
    setupTreasuryAccount,
  ]);

  return {
    withdrawAmount,
    setWithdrawAmount,
    isWithdrawing,
    isWithdrawValid,
    handleWithdraw,
  };
};
