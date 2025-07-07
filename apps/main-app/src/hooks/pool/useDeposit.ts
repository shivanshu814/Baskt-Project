import { useState, useCallback } from 'react';
import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { useBasktClient, USDC_MINT, PRICE_PRECISION } from '@baskt/ui';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { toast } from 'sonner';
import type { UseDepositProps } from '../../types/pool';
import { useProtocol } from '../protocol/useProtocol';
import { useUSDCBalance } from '../pool/useUSDCBalance';

export const useDeposit = ({ poolData, liquidityPool, onSuccess }: UseDepositProps) => {
  const { client, wallet } = useBasktClient();
  const { protocol } = useProtocol();
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const { refetch: refetchUSDCBalance } = useUSDCBalance();

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
        toast.error('Invalid deposit amount');
        setIsDepositing(false);
        return;
      }
      const depositAmountBN = new BN(depositAmountNum * PRICE_PRECISION);
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
          toast.error('Failed to create LP token account. Please try again.');
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
      refetchUSDCBalance();

      toast.success('Deposit successful! Your deposit has been processed');
      setDepositAmount('');
      onSuccess?.();
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        if (error.message.includes('Treasury')) {
          toast.error('Treasury account error. Please contact support.');
        } else if (error.message.includes('insufficient funds')) {
          toast.error('Insufficient USDC balance for deposit');
        } else {
          toast.error('Failed to deposit. Please try again.');
        }
      } else {
        toast.error('Failed to deposit. Please try again.');
      }
    } finally {
      setIsDepositing(false);
    }
  }, [
    client,
    wallet,
    liquidityPool,
    poolData,
    depositAmount,
    isDepositValid,
    onSuccess,
    refetchUSDCBalance,
    protocol,
  ]);

  return {
    depositAmount,
    setDepositAmount,
    isDepositing,
    isDepositValid,
    handleDeposit,
  };
};
