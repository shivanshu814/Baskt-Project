import { useBasktClient } from '@baskt/ui';
import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { calculateAmount, calculatePercentage } from '../../../utils/calculation/calculations';
import { validateCloseAmount } from '../../../utils/validation/validation';

export const useClosePosition = (position: any, onClose: () => void) => {
  const { client } = useBasktClient();
  const [closeAmount, setCloseAmount] = useState('');
  const [closePercentage, setClosePercentage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const positionSize = position?.size || 0;

  useEffect(() => {
    if (position) {
      setCloseAmount(positionSize.toString());
      setClosePercentage('100.0');
      setError(null);
    }
  }, [position, positionSize]);

  const handleAmountChange = (value: string) => {
    const validationError = validateCloseAmount(value, positionSize);
    setError(validationError);
    setCloseAmount(value);

    if (!validationError) {
      const numValue = parseFloat(value);
      if (numValue > 0) {
        const percentage = calculatePercentage(numValue, positionSize);
        setClosePercentage(percentage);
      } else {
        setClosePercentage('');
      }
    }
  };

  const handleSliderChange = (percentage: number) => {
    const amount = calculateAmount(percentage, positionSize);
    setCloseAmount(amount);
    setClosePercentage(percentage.toFixed(1));
    setError(null);
  };

  const handlePercentageChange = (value: string) => {
    if (value === '') {
      setClosePercentage('');
      setCloseAmount('0');
    } else {
      const numValue = parseInt(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        const percentage = numValue.toString();
        setClosePercentage(percentage);
        const amount = calculateAmount(numValue, positionSize);
        setCloseAmount(amount);
        setError(null);
      }
    }
  };

  const handleMaxClick = () => {
    setCloseAmount(positionSize.toString());
    setClosePercentage('100.0');
    setError(null);
  };

  const handleSubmit = async () => {
    const validationError = validateCloseAmount(closeAmount, positionSize);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!client) {
      toast.error('Wallet not connected');
      return;
    }

    if (!position?.positionPDA) {
      toast.error('Invalid position data');
      return;
    }

    const isFullClose = parseFloat(closePercentage || '0') >= 99.99;
    const closeType = isFullClose ? 'full' : 'partial';

    setIsLoading(true);
    try {
      const toastId = toast.loading(`Closing position...`);

      const closeAmountBN =
        closeType === 'full' ? new BN(position.size) : new BN(parseFloat(closeAmount) * 1e6);

      const orderId = client.newUID();

      const tx = await client.createMarketCloseOrder({
        orderId,
        basktId: new PublicKey(position.basktId),
        sizeAsContracts: closeAmountBN,
        targetPosition: new PublicKey(position.positionPDA),
        ownerTokenAccount: await client
          .getUSDCAccount(client.getPublicKey())
          .then((acc) => acc.address),
      });

      const confirmation = await client.connection.confirmTransaction(tx);

      if (confirmation.value.err) {
        toast.dismiss(toastId);
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      toast.dismiss(toastId);
      toast.success(`Position closed successfully!`);
      onClose();
    } catch (error: any) {
      console.error('Error closing position:', error);

      if (error?.message?.includes('insufficient')) {
        toast.error('Insufficient balance for this transaction');
      } else if (error?.message?.includes('position')) {
        toast.error('Position not found or invalid');
      } else if (error?.message?.includes('network')) {
        toast.error('Network error. Please try again');
      } else {
        toast.error('Failed to close position. Please try again');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    closeAmount,
    closePercentage,
    isLoading,
    error,
    positionSize,
    handleAmountChange,
    handleSliderChange,
    handlePercentageChange,
    handleMaxClick,
    handleSubmit,
  };
};
