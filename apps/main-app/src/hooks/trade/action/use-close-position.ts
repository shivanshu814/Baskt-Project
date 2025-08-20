import { useBasktClient } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { calculateAmount, calculatePercentage } from '../../../utils/calculation/calculations';
import { validateCloseAmount } from '../../../utils/validation/validation';

export const useClosePosition = (position: any, onClose: () => void) => {
  const { client } = useBasktClient();

  const [closeAmount, setCloseAmount] = useState('');
  const [closePercentage, setClosePercentage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePositionStructure = useCallback((pos: any): string | null => {
    if (!pos) return 'Position data is missing';
    if (!pos.positionPDA) return 'Position PDA is missing';
    if (!pos.basktAddress) return 'Baskt ID is missing';
    if (!pos.size) return 'Position size is missing';
    if (!pos.entryPrice) return 'Entry price is missing';
    const sizeNum = Number(pos.size);
    if (isNaN(sizeNum) || sizeNum <= 0) return 'Position size must be a positive number';

    return null;
  }, []);

  const positionSize = useMemo(() => Number(position?.size || 0), [position?.size]);
  const positionEntryPrice = useMemo(
    () => Number(position?.entryPrice || 0),
    [position?.entryPrice],
  );
  const positionUsdcSizeMicro = useMemo(() => {
    if (position?.usdcSize !== undefined && position?.usdcSize !== null) {
      return Number(position.usdcSize);
    }
    if (positionSize > 0 && positionEntryPrice > 0) {
      return positionSize * positionEntryPrice;
    }
    return 0;
  }, [position?.usdcSize, positionSize, positionEntryPrice]);
  const positionValue = useMemo(() => positionUsdcSizeMicro / 1e6, [positionUsdcSizeMicro]);

  useEffect(() => {
    if (position) {
      setCloseAmount(positionValue.toFixed(2));
      setClosePercentage('100.0');
      setError(null);
    }
  }, [position, positionValue]);

  const handleAmountChange = useCallback(
    (value: string) => {
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
    },
    [positionValue],
  );

  const handleSliderChange = useCallback(
    (percentage: number) => {
      const amount = calculateAmount(percentage, positionValue);
      setCloseAmount(parseFloat(amount).toFixed(2));
      setClosePercentage(percentage.toFixed(1));
      setError(null);
    },
    [positionValue],
  );

  const handlePercentageChange = useCallback(
    (value: string) => {
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
    },
    [positionValue],
  );

  const handleMaxClick = useCallback(() => {
    setCloseAmount(positionValue.toFixed(2));
    setClosePercentage('100.0');
    setError(null);
  }, [positionValue]);

  const handleSubmit = useCallback(async () => {
    const validationError = validateCloseAmount(closeAmount, positionValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!client) {
      toast.error('Wallet not connected');
      return;
    }

    const positionValidationError = validatePositionStructure(position);
    if (positionValidationError) {
      toast.error(positionValidationError);
      return;
    }

    if (typeof position !== 'object' || position === null) {
      toast.error('Position object is not valid');
      return;
    }

    const isFullClose = parseFloat(closePercentage || '0') >= 99.99;
    let amountBeingClosed = isFullClose ? positionValue : closeAmount;

    setIsLoading(true);
    try {
      const toastId = toast.loading(`Closing position...`);

      let numOfContractsToClose: BN;
      numOfContractsToClose = new BN(Number(amountBeingClosed) * 1e6).mul(new BN(position.size)).div(new BN(Number(positionValue) * 1e6));

      if (!numOfContractsToClose || !numOfContractsToClose.gt(new BN(0))) {
        throw new Error('Created BN is invalid or zero : ' + numOfContractsToClose.toString());
      }

      const orderId = client.newUID();

      const tx = await client.createMarketCloseOrder({
        orderId,
        basktId: new PublicKey(position.basktAddress),
        sizeAsContracts: numOfContractsToClose,
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
  }, [
    closeAmount,
    closePercentage,
    positionValue,
    positionSize,
    client,
    position,
    validatePositionStructure,
    onClose,
  ]);

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
