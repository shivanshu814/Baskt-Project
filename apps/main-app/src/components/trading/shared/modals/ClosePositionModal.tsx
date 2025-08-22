'use client';

import { Button, Input, NumberFormat } from '@baskt/ui';
import { X } from 'lucide-react';
import { useClosePosition } from '../../../../hooks/trade/action/use-close-position';
import { usePositionInfo } from '../../../../hooks/trade/action/use-position-info';
import { ClosePositionModalProps } from '../../../../types/baskt/trading/components/tabs';
import { PercentageSlider } from '../percentage/PercentageSlider';
import { ModalBackdrop } from './ModalBackdrop';

export function ClosePositionModal({ isOpen, onClose, position }: ClosePositionModalProps) {
  const {
    closeAmount,
    closePercentage,
    isLoading,
    error,
    handleAmountChange,
    handleSliderChange,
    handlePercentageChange,
    handleMaxClick,
    handleSubmit,
  } = useClosePosition(position, onClose);
  const { positionType, positionTypeColor, formattedCloseAmount, positionValue } = usePositionInfo(
    position,
    closeAmount,
  );
  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-foreground">Close Position</h3>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted/50"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Position Type</span>
              <span className={positionTypeColor}>{positionType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Position Value</span>
              <span className="font-semibold text-foreground">
                <NumberFormat value={Math.round(positionValue * 100) / 100} isPrice={true} />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount to Close</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9.]*"
                  placeholder="0.00"
                  className="w-24 text-right border-none bg-transparent p-0 text-sm font-bold focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={closeAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  min="0.01"
                  step="0.01"
                  max={positionValue}
                  aria-label="Amount to close"
                  disabled={isLoading}
                />

                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 py-1 text-xs hover:bg-muted border-none"
                  onClick={handleMaxClick}
                  disabled={isLoading}
                >
                  Max
                </Button>
              </div>
            </div>
          </div>
        </div>
        <PercentageSlider
          percentage={closePercentage}
          onSliderChange={handleSliderChange}
          onPercentageChange={handlePercentageChange}
          positionSize={position?.size || 0}
          isLoading={isLoading}
        />

        <div className="px-1 py-1">
          <div className="text-sm text-red-500 font-medium">{error}</div>
        </div>
      </div>

      <div className="flex gap-3 pt-8">
        <Button
          onClick={onClose}
          variant="outline"
          className="flex-1 border-border hover:bg-muted/50"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Closing...
            </div>
          ) : (
            'Close Position'
          )}
        </Button>
      </div>
    </ModalBackdrop>
  );
}
