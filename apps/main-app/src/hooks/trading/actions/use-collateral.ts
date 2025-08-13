import { useBasktClient } from '@baskt/ui';
import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  calculateAmountFromPercentage,
  calculatePercentage,
} from '../../../utils/calculation/calculations';
import { validateAmount, validatePercentage } from '../../../utils/validation/validation';
import { useUSDCBalance } from '../../pool/use-usdc-balance';
import { useModalState } from '../modals/use-modal-state';

export const useCollateral = (position?: any) => {
  const { client } = useBasktClient();
  const modalState = useModalState();
  const userAddress = client?.wallet?.address?.toString();
  const { balance: usdcBalance } = useUSDCBalance(userAddress);
  const [amount, setAmount] = useState<string>('');
  const [amountPercentage, setAmountPercentage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const selectedPosition = position || modalState.selectedPositionForModal;

  const clearData = useCallback(() => {
    setAmount('');
    setAmountPercentage('');
    setIsLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    clearData();
    modalState.setIsAddCollateralModalOpen(false);
  }, [clearData, modalState]);

  const handleAmountChange = useCallback(
    (value: string) => {
      const numValue = parseFloat(value);
      const maxAmount = Number(usdcBalance);

      if (!validateAmount(value, maxAmount)) {
        setAmount(value);
        return;
      }

      setAmount(value);

      if (numValue > 0 && maxAmount > 0) {
        const percentage = calculatePercentage(numValue, maxAmount);
        setAmountPercentage(percentage);
      } else {
        setAmountPercentage('');
      }
    },
    [usdcBalance],
  );

  const handleSliderChange = useCallback(
    (percentage: number) => {
      const maxAmount = Number(usdcBalance);
      const amount = calculateAmountFromPercentage(percentage, maxAmount);
      setAmount(amount);
      setAmountPercentage(percentage.toFixed(1));
    },
    [usdcBalance],
  );

  const handlePercentageChange = useCallback(
    (value: string) => {
      if (value === '') {
        setAmountPercentage('');
        setAmount('0');
      } else {
        const numValue = parseInt(value);
        if (validatePercentage(numValue)) {
          handleSliderChange(numValue);
        }
      }
    },
    [handleSliderChange],
  );

  const handleMaxAmount = useCallback(() => {
    const maxAmount = Number(usdcBalance);
    if (!isNaN(maxAmount)) {
      const formattedAmount = maxAmount > 0 ? maxAmount.toFixed(6).replace(/\.?0+$/, '') : '0';
      setAmount(formattedAmount);
      setAmountPercentage('100.0');
    }
  }, [usdcBalance]);

  const handleAddCollateral = useCallback(
    async (amount: string, position: any) => {
      if (!client) {
        toast.error('Wallet not connected');
        return;
      }

      if (!position?.positionPDA) {
        toast.error('Invalid position data');
        return;
      }

      try {
        const amountBN = new BN(parseFloat(amount) * 1e6);
        const userUSDCAccount = await client.getUSDCAccount(client.getPublicKey());

        const tx = await client.addCollateral({
          position: new PublicKey(position.positionPDA),
          additionalCollateral: amountBN,
          ownerTokenAccount: userUSDCAccount.address,
        });

        return tx;
      } catch (error: any) {
        console.error('Error adding collateral:', error);

        if (error?.message?.includes('insufficient')) {
          toast.error('Insufficient USDC balance for this transaction');
        } else if (error?.message?.includes('position')) {
          toast.error('Position not found or invalid');
        } else if (error?.message?.includes('network')) {
          toast.error('Network error. Please try again');
        } else {
          toast.error('Failed to add collateral. Please try again');
        }
        throw error;
      }
    },
    [client],
  );

  const openAddCollateralModal = useCallback(
    (position: any) => {
      modalState.openAddCollateralModal(position);
    },
    [modalState],
  );

  const handleSubmit = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!selectedPosition) {
      toast.error('No position selected');
      return;
    }

    const amountNum = parseFloat(amount);
    const balanceNum = Number(usdcBalance);

    if (amountNum > balanceNum) {
      toast.error(`Insufficient balance. You have ${balanceNum.toFixed(2)} USDC`);
      return;
    }

    setIsLoading(true);

    try {
      const toastId = toast.loading(`Adding ${amount} USDC collateral...`);

      await handleAddCollateral(amount, selectedPosition);

      toast.dismiss(toastId);
      toast.success(`Successfully added ${amount} USDC collateral to position`);

      window.dispatchEvent(new Event('collateral-added'));
      window.dispatchEvent(new Event('balance-updated'));

      clearData();
      handleClose();
    } catch (error) {
      console.error('Error adding collateral:', error);
      toast.error('Failed to add collateral');
    } finally {
      setIsLoading(false);
    }
  }, [amount, selectedPosition, handleAddCollateral, clearData, handleClose, usdcBalance]);

  return {
    amount,
    amountPercentage,
    isLoading,
    selectedPosition,
    isModalOpen: modalState.isAddCollateralModalOpen,
    handleAmountChange,
    handleSliderChange,
    handlePercentageChange,
    handleMaxAmount,
    handleSubmit,
    handleClose,
    openAddCollateralModal,
    clearData,
    usdcBalance,
  };
};
