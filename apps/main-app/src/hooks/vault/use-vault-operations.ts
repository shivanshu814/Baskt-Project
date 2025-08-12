import { PRICE_PRECISION, USDC_MINT, useBasktClient } from '@baskt/ui';
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { UseDepositProps, UseVaultTabsReturn, UseWithdrawProps } from '../../types/vault';
import { useUSDCBalance } from '../pool/use-usdc-balance';
import { useProtocol } from '../protocol/use-protocol';

// handle vault tabs
export function useVaultTabs(
  userUSDCBalance: string,
  userLpBalance: string,
  setDepositAmount: (amount: string) => void,
  setWithdrawAmount: (amount: string) => void,
): UseVaultTabsReturn {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as 'deposit' | 'withdraw');
  }, []);

  const handleMaxDeposit = useCallback(() => {
    setDepositAmount(userUSDCBalance);
  }, [userUSDCBalance, setDepositAmount]);

  const handleMaxWithdraw = useCallback(() => {
    setWithdrawAmount(userLpBalance);
  }, [userLpBalance, setWithdrawAmount]);

  return {
    activeTab,
    handleTabChange,
    handleMaxDeposit,
    handleMaxWithdraw,
  };
}

// handle deposits
export function useDeposit({ vaultData, liquidityPool, onSuccess }: UseDepositProps) {
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
      !vaultData ||
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
        new PublicKey(vaultData.lpMint),
        new PublicKey(wallet.address),
      );
      try {
        await client.getUserTokenAccount(
          new PublicKey(wallet.address),
          new PublicKey(vaultData.lpMint),
        );
      } catch (error) {
        try {
          const createAtaIx = createAssociatedTokenAccountInstruction(
            new PublicKey(wallet.address),
            userLPAta,
            new PublicKey(wallet.address),
            new PublicKey(vaultData.lpMint),
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
        new PublicKey(protocol?.collateralMint),
        protocol?.treasury,
      );

      await client.addLiquidityWithItx(
        liquidityPool,
        depositAmountBN,
        minSharesOut,
        userTokenAccount.address,
        new PublicKey(vaultData.tokenVault),
        userLPAta,
        new PublicKey(vaultData.lpMint),
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
    vaultData,
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
}

// handle withdrawals
export function useWithdraw({ vaultData, liquidityPool, onSuccess }: UseWithdrawProps) {
  const { client, wallet } = useBasktClient();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const isWithdrawValid = Boolean(
    withdrawAmount && !isNaN(Number(withdrawAmount)) && Number(withdrawAmount) > 0,
  );

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
