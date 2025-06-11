import { useState, useCallback } from 'react';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { useBasktClient, USDC_MINT } from '@baskt/ui';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { useToast } from '../common/use-toast';
import type { UseDepositProps } from '../../types/pool';
import { useProtocol } from '../protocol/useProtocol';

export const useDeposit = ({ poolData, liquidityPool, onSuccess }: UseDepositProps) => {
  const { client, wallet } = useBasktClient();
  const { toast } = useToast();
  const { protocol } = useProtocol();
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  const isDepositValid = Boolean(
    depositAmount && !isNaN(Number(depositAmount)) && Number(depositAmount) > 0,
  );

  const handleDeposit = useCallback(async () => {
    if (
      !isDepositValid ||
      !client ||
      !wallet?.address ||
      !liquidityPool ||
      !poolData ||
      !protocol
    ) {
      return;
    }

    try {
      setIsDepositing(true);

      const depositAmountNum = Number(depositAmount);
      if (isNaN(depositAmountNum)) {
        toast({
          title: 'Invalid deposit amount',
          variant: 'destructive',
        });
        setIsDepositing(false);
        return;
      }
      const depositAmountBN = new BN(depositAmountNum * 1e6);
      const userTokenAccount = await client.getUserTokenAccount(
        new PublicKey(wallet.address),
        USDC_MINT,
      );

      const itx = [];
      const userLPAta = getAssociatedTokenAddressSync(
        new PublicKey(poolData.lpMint),
        new PublicKey(wallet.address),
      );
      try {
        await client.getUserTokenAccount(
          new PublicKey(wallet.address),
          new PublicKey(poolData.lpMint),
        );
      } catch (error) {
        try {
          const createAtaIx = createAssociatedTokenAccountInstruction(
            new PublicKey(wallet.address),
            userLPAta,
            new PublicKey(wallet.address),
            new PublicKey(poolData.lpMint),
          );
          itx.push(createAtaIx);
        } catch (createError) {
          toast({
            title: 'Failed to create LP token account. Please try again.',
            variant: 'destructive',
          });
          setIsDepositing(false);
          return;
        }
      }

      const minSharesOut = new BN(0);

      const treasuryTokenAccount = await getAssociatedTokenAddressSync(
        new PublicKey(protocol?.escrowMint),
        protocol?.treasury,
      );

      await client.addLiquidityWithItx(
        liquidityPool,
        depositAmountBN,
        minSharesOut,
        userTokenAccount.address,
        new PublicKey(poolData.tokenVault),
        userLPAta,
        new PublicKey(poolData.lpMint),
        treasuryTokenAccount,
        protocol?.treasury,
        itx,
      );

      toast({
        title: 'Deposit successful!',
        description: 'Your deposit has been processed',
        variant: 'default',
      });
      setDepositAmount('');
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
            title: 'Insufficient USDC balance for deposit',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Failed to deposit. Please try again.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Failed to deposit. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsDepositing(false);
    }
  }, [client, wallet, liquidityPool, poolData, depositAmount, isDepositValid, onSuccess, toast]);

  return {
    depositAmount,
    setDepositAmount,
    isDepositing,
    isDepositValid,
    handleDeposit,
  };
};
