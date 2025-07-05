import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Label,
  Input,
  Button,
  PRICE_PRECISION,
} from '@baskt/ui';
import { useUSDCBalance } from '../../../hooks/pool/useUSDCBalance';
import BN from 'bn.js';
import { AddCollateralDialogProps } from '../../../types/baskt';
import { parseSolanaError } from '../../../utils/error-handling';

const AddCollateralDialog: React.FC<AddCollateralDialogProps> = ({
  position,
  isOpen,
  onClose,
  onAddCollateral,
}) => {
  const [collateralAmount, setCollateralAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { balance: usdcBalance } = useUSDCBalance();

  // Reset form when dialog opens with new position
  useEffect(() => {
    if (isOpen && position) {
      setCollateralAmount('');
      setError(null);
    }
  }, [isOpen, position]);

  if (!position) {
    return null;
  }

  const handleSubmit = async () => {
    if (!collateralAmount || parseFloat(collateralAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(collateralAmount);

    // Check if the amount is more than the user's balance
    if (amount > parseFloat(usdcBalance)) {
      setError(`Insufficient balance. You have ${usdcBalance} USDC available`);
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);

      // Convert to program units (adding 6 decimal places)
      const collateralBN = new BN(amount * PRICE_PRECISION);

      await onAddCollateral(position, collateralBN);

      // Close dialog on success
      onClose();
    } catch (error: unknown) {
      const parsedError = parseSolanaError(
        error instanceof Error ? error.message : 'Failed to add collateral',
      );
      setError(parsedError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCollateral = position?.collateral
    ? `$${(new BN(position.collateral).toNumber() / PRICE_PRECISION).toFixed(2)}`
    : '-';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Collateral</DialogTitle>
          <DialogDescription>
            Add more collateral to your position to reduce the risk of liquidation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="currentCollateral" className="text-left sm:text-right">
              Current Collateral
            </Label>
            <Input
              id="currentCollateral"
              value={currentCollateral}
              readOnly
              className="sm:col-span-3 bg-muted"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="collateralAmount" className="text-left sm:text-right">
              Amount to Add*
            </Label>
            <div className="sm:col-span-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm">
                  $
                </span>
                <Input
                  id="collateralAmount"
                  type="number"
                  placeholder="0.00"
                  className="pl-7"
                  value={collateralAmount}
                  onChange={(e) => {
                    setCollateralAmount(e.target.value);
                    setError(null);
                  }}
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>
              {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !collateralAmount || parseFloat(collateralAmount) <= 0}
          >
            {isSubmitting ? 'Processing...' : 'Add Collateral'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCollateralDialog;
