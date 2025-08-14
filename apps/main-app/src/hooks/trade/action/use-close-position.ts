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

  const positionSize = Number(position?.size || 0);
  const positionEntryPrice = Number(position?.entryPrice || 0);
  const positionUsdcSizeMicro =
    position?.usdcSize !== undefined && position?.usdcSize !== null
      ? Number(position.usdcSize)
      : positionSize > 0 && positionEntryPrice > 0
      ? positionSize * positionEntryPrice
      : 0;
  const positionValue = positionUsdcSizeMicro / 1e6;

  useEffect(() => {
    if (position) {
      setCloseAmount(positionValue.toFixed(2));
      setClosePercentage('100.0');
      setError(null);
    }
  }, [position, positionValue]);

  const handleAmountChange = (value: string) => {
    const validationError = validateCloseAmount(value, positionValue);
    setError(validationError);
    setCloseAmount(value);

    if (!validationError) {
      const numValue = parseFloat(value);
      if (numValue > 0) {
        const percentage = calculatePercentage(numValue, positionValue);
        setClosePercentage(percentage);
      } else {
        setClosePercentage('');
      }
    }
  };

  const handleSliderChange = (percentage: number) => {
    const amount = calculateAmount(percentage, positionValue);
    setCloseAmount(parseFloat(amount).toFixed(2));
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
        const amount = calculateAmount(numValue, positionValue);
        setCloseAmount(parseFloat(amount).toFixed(2));
        setError(null);
      }
    }
  };

  const handleMaxClick = () => {
    setCloseAmount(positionValue.toFixed(2));
    setClosePercentage('100.0');
    setError(null);
  };

  const handleSubmit = async () => {
    const validationError = validateCloseAmount(closeAmount, positionValue);
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

      // Convert value (USDC) to contracts proportionally: sizeToClose = fraction * totalSize
      let closeAmountBN: BN;
      if (closeType === 'full') {
        closeAmountBN = new BN(position.size);
      } else {
        const closeValue = parseFloat(closeAmount); // decimal USDC
        const fraction = positionValue > 0 ? closeValue / positionValue : 0;
        const sizeToClose = fraction * positionSize; // contracts (decimal)
        closeAmountBN = new BN(Math.floor(sizeToClose * 1e6)); // convert to micro-contracts
      }

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
      window.dispatchEvent(new Event('order-created'));
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
