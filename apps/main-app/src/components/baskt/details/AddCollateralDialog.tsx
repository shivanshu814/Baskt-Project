import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { useUSDCBalance } from '../../../hooks/pool/useUSDCBalance';
import BN from 'bn.js';
import { AddCollateralDialogProps } from '../../../types/baskt';

const AddCollateralDialog: React.FC<AddCollateralDialogProps> = ({
  position,
  isOpen,
  onClose,
  onAddCollateral,
}) => {
  const [collateralAmount, setCollateralAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { balance: usdcBalance, loading: balanceLoading } = useUSDCBalance();

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
      const collateralBN = new BN(amount * 1e6);

      await onAddCollateral(position, collateralBN);

      // Close dialog on success
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add collateral';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCollateral = position?.collateral
    ? `$${(new BN(position.collateral).toNumber() / 1e6).toFixed(2)}`
    : '-';

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Collateral to Position</DialogTitle>
          <DialogDescription>
            Enter the amount of collateral (USDC) to add to your position.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="positionIdDisplay" className="text-right col-span-1">
              Position ID
            </Label>
            <Input
              id="positionIdDisplay"
              value={position.positionId.toString()}
              readOnly
              className="col-span-3 bg-muted"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currentCollateral" className="text-right col-span-1">
              Current Collateral
            </Label>
            <Input
              id="currentCollateral"
              value={currentCollateral}
              readOnly
              className="col-span-3 bg-muted"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="availableBalance" className="text-right col-span-1">
              Available USDC
            </Label>
            <Input
              id="availableBalance"
              value={balanceLoading ? 'Loading...' : `$${usdcBalance}`}
              readOnly
              className="col-span-3 bg-muted"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="collateralAmount" className="text-right col-span-1">
              Amount to Add*
            </Label>
            <div className="col-span-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">$</span>
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
            <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
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
