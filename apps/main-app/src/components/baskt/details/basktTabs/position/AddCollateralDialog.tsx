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
import { useUSDCBalance } from '../../../../../hooks/pool/useUSDCBalance';
import BN from 'bn.js';
import { AddCollateralDialogProps } from '../../../../../types/baskt';
import { parseSolanaError } from '../../../../../utils/common/error-handling';
import { DollarSign, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';

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
    if (amount > parseFloat(usdcBalance)) {
      setError(`Insufficient balance. You have ${usdcBalance} USDC available`);
      return;
    }
    try {
      setError(null);
      setIsSubmitting(true);
      const collateralBN = new BN(amount * PRICE_PRECISION);
      await onAddCollateral(position, collateralBN);
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
    ? (new BN(position.collateral).toNumber() / PRICE_PRECISION).toFixed(2)
    : '-';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] rounded-2xl p-0 overflow-hidden shadow-2xl border border-border">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-green-600" />
            Add Collateral
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground mt-1">
            Add more collateral to your position to reduce the risk of liquidation.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-6">
          <div className="flex items-center justify-between bg-muted/60 rounded-lg px-4 py-3">
            <span className="text-sm text-muted-foreground font-medium">Current Collateral</span>
            <span className="font-bold text-lg text-green-600">${currentCollateral}</span>
          </div>

          <div>
            <Label
              htmlFor="collateralAmount"
              className="block mb-2 text-sm font-medium text-foreground"
            >
              Amount to Add <span className="text-destructive">*</span>
            </Label>
            <div className="relative flex items-center">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <DollarSign className="w-5 h-5" />
              </span>
              <Input
                id="collateralAmount"
                type="number"
                inputMode="decimal"
                pattern="[0-9.]*"
                placeholder="0.00"
                className="pl-10 pr-20 py-3 bg-background border border-border rounded-lg text-lg font-semibold focus:ring-2 focus:ring-primary/30 transition"
                value={collateralAmount}
                onChange={(e) => {
                  setCollateralAmount(e.target.value);
                  setError(null);
                }}
                required
                min="0.01"
                step="0.01"
                aria-label="Amount to add"
                autoFocus
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-secondary px-3 py-1 rounded-full hover:bg-primary hover:text-primary-foreground transition font-semibold"
                onClick={() => setCollateralAmount(usdcBalance)}
                tabIndex={0}
                aria-label="Max"
                disabled={isSubmitting}
              >
                Max
              </button>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                Available: <span className="font-medium">${usdcBalance}</span>
              </span>
              {error && (
                <span className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="w-4 h-4" /> {error}
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 flex flex-col gap-2">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !collateralAmount || parseFloat(collateralAmount) <= 0}
            className="w-full py-3 text-base bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg flex items-center justify-center gap-2 transition rounded-lg"
            aria-label="Add Collateral"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Add Collateral
              </>
            )}
          </Button>
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="w-full py-3 text-base rounded-lg"
              disabled={isSubmitting}
              aria-label="Cancel"
            >
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCollateralDialog;
