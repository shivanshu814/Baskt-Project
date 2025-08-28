import { useBasktClient } from '@baskt/ui';
import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  calculateAmountFromPercentage,
  calculatePercentage,
} from '../../../../utils/calculation/calculations';
import { validateAmount, validatePercentage } from '../../../../utils/validation/validation';
import { useUSDCBalance } from '../../../balance/use-usdc-balance';
import { useModalState } from '../../modals/use-modal-state';

export const useAddCollateral = (position?: any) => {
  const { client } = useBasktClient();
  const modalState = useModalState();
  const userAddress = client?.wallet?.address?.toString();
  const { balance: usdcBalance } = useUSDCBalance(userAddress);

  const [amount, setAmount] = useState<string>('');
  const [amountPercentage, setAmountPercentage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedPosition = position || modalState.selectedPositionForModal;
  const balanceNum = Number(usdcBalance);

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
      if (!validateAmount(value, balanceNum)) {
        setAmount(value);
        return;
      }

      setAmount(value);
      const numValue = parseFloat(value);

      if (numValue > 0 && balanceNum > 0) {
        const percentage = calculatePercentage(numValue, balanceNum);
        setAmountPercentage(percentage);
      } else {
        setAmountPercentage('');
      }
    },
    [balanceNum],
  );

  const handleSliderChange = useCallback(
    (percentage: number) => {
      const calculatedAmount = calculateAmountFromPercentage(percentage, balanceNum);
      setAmount(calculatedAmount);
      setAmountPercentage(percentage.toFixed(1));
    },
    [balanceNum],
  );

  const handlePercentageChange = useCallback(
    (value: string) => {
      if (value === '') {
        setAmountPercentage('');
        setAmount('0');
        return;
      }

      const numValue = parseInt(value);
      if (validatePercentage(numValue)) {
        handleSliderChange(numValue);
      }
    },
    [handleSliderChange],
  );

  const handleMaxAmount = useCallback(() => {
    if (balanceNum > 0) {
      const formattedAmount = balanceNum.toFixed(6).replace(/\.?0+$/, '');
      setAmount(formattedAmount);
      setAmountPercentage('100.0');
    }
  }, [balanceNum]);

  const openAddCollateralModal = useCallback(
    (position: any) => {
      modalState.openAddCollateralModal(position);
    },
    [modalState],
  );

  const addCollateral = useCallback(
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

        const errorMessage = error?.message?.toLowerCase() || '';
        if (errorMessage.includes('insufficient')) {
          toast.error('Insufficient USDC balance for this transaction');
        } else if (errorMessage.includes('position')) {
          toast.error('Position not found or invalid');
        } else if (errorMessage.includes('network')) {
          toast.error('Network error. Please try again');
        } else {
          toast.error('Failed to add collateral. Please try again');
        }
        throw error;
      }
    },
    [client],
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
    if (amountNum > balanceNum) {
      toast.error(`Insufficient balance. You have ${balanceNum.toFixed(2)} USDC`);
      return;
    }

    setIsLoading(true);

    try {
      const toastId = toast.loading(`Adding ${amount} USDC collateral...`);
      await addCollateral(amount, selectedPosition);

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
  }, [amount, selectedPosition, addCollateral, clearData, handleClose, balanceNum]);

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
