import { useBasktClient } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { calculateAmount, calculatePercentage } from '../../../../utils/calculation/calculations';
import { validateCloseAmount } from '../../../../utils/validation/validation';

export const useClosePosition = (position: any, onClose: () => void) => {
  const { client } = useBasktClient();

  const [closeAmount, setCloseAmount] = useState('');
  const [closePercentage, setClosePercentage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const positionData = useMemo(() => {
    if (!position) return null;

    const size = Number(position.remainingSize || 0);
    const entryPrice = Number(position.entryPrice || 0);
    const remainingSize =
      position.remainingSize !== undefined ? Number(position.remainingSize) : size * entryPrice;
    const value = Number(position.positionValue || 0) / 1e6;

    return { size, entryPrice, remainingSize, value };
  }, [position]);

  useEffect(() => {
    if (positionData) {
      setCloseAmount(positionData.value.toFixed(2));
      setClosePercentage('100.0');
    }
  }, [positionData]);

  const handleAmountChange = useCallback(
    (value: string) => {
      if (!positionData) return;

      const validationError = validateCloseAmount(value, positionData.value);
      setCloseAmount(value);

      if (!validationError && parseFloat(value) > 0) {
        const percentage = calculatePercentage(parseFloat(value), positionData.value);
        setClosePercentage(percentage);
      } else {
        setClosePercentage('');
      }
    },
    [positionData],
  );

  const handleSliderChange = useCallback(
    (percentage: number) => {
      if (!positionData) return;

      const amount = calculateAmount(percentage, positionData.value);
      setCloseAmount(parseFloat(amount).toFixed(2));
      setClosePercentage(percentage.toFixed(1));
    },
    [positionData],
  );

  const handlePercentageChange = useCallback(
    (value: string) => {
      if (!positionData) return;

      if (value === '') {
        setClosePercentage('');
        setCloseAmount('0');
        return;
      }

      const numValue = parseInt(value);
      if (numValue >= 0 && numValue <= 100) {
        setClosePercentage(value);
        const amount = calculateAmount(numValue, positionData.value);
        setCloseAmount(parseFloat(amount).toFixed(2));
      }
    },
    [positionData],
  );

  const handleMaxClick = useCallback(() => {
    if (!positionData) return;

    setCloseAmount(positionData.value.toFixed(2));
    setClosePercentage('100.0');
  }, [positionData]);

  const handleSubmit = useCallback(async () => {
    console.log('positionData', positionData);
    if (!positionData || !client) {
      toast.error(!client ? 'Wallet not connected' : 'Invalid position data');
      return;
    }

    const validationError = validateCloseAmount(closeAmount, positionData.value);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    console.log('position', position);

    if (
      !position.positionPDA ||
      !position.basktId ||
      !position.remainingSize ||
      !position.entryPrice
    ) {
      toast.error('Invalid position data');
      return;
    }

    const isFullClose = parseFloat(closePercentage || '0') >= 99.99;
    const amountBeingClosed = isFullClose ? positionData.value : parseFloat(closeAmount);

    setIsLoading(true);

    try {
      const toastId = toast.loading('Closing position...');

      const numOfContractsToClose = new BN(amountBeingClosed * 1e6)
        .mul(new BN(positionData.remainingSize))
        .div(new BN(positionData.value * 1e6));

      if (!numOfContractsToClose.gt(new BN(0))) {
        throw new Error('Invalid contract calculation');
      }

      const orderId = client.newUID();
      const tx = await client.createMarketCloseOrder({
        orderId,
        basktId: new PublicKey(position.basktId),
        sizeAsContracts: numOfContractsToClose,
        targetPosition: new PublicKey(position.positionPDA),
        ownerTokenAccount: await client
          .getUSDCAccount(client.getPublicKey())
          .then((acc) => acc.address),
      });

      const confirmation = await client.connection.confirmTransaction(tx);
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      toast.dismiss(toastId);
      toast.success('Position closed successfully!');
      window.dispatchEvent(new Event('order-created'));
      onClose();
    } catch (error: any) {
      console.error('Error closing position:', error);

      const errorMessage = error?.message?.toLowerCase() || '';
      if (errorMessage.includes('insufficient')) {
        toast.error('Insufficient balance for this transaction');
      } else if (errorMessage.includes('position')) {
        toast.error('Position not found or invalid');
      } else if (errorMessage.includes('network')) {
        toast.error('Network error. Please try again');
      } else {
        toast.error('Failed to close position. Please try again');
      }
    } finally {
      setIsLoading(false);
    }
  }, [closeAmount, closePercentage, positionData, client, position, onClose]);

  return {
    closeAmount,
    closePercentage,
    isLoading,
    positionSize: positionData?.remainingSize || 0,
    handleAmountChange,
    handleSliderChange,
    handlePercentageChange,
    handleMaxClick,
    handleSubmit,
  };
};
