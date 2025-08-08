'use client';

import { X } from 'lucide-react';
import { useClosePosition } from '../../../../hooks/trading/actions/use-close-position';
import { ClosePositionModalProps } from '../../../../types/trading/modals';
import { PositionInfoCard } from '../cards/PositionInfoCard';
import { PercentageSlider } from '../forms/PercentageSlider';
import { ErrorDisplay } from '../helper/ErrorDisplay';
import { ClosePositionActionButtons } from './ClosePositionActionButtons';
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
        <PositionInfoCard
          position={position}
          closeAmount={closeAmount}
          onAmountChange={handleAmountChange}
          onMaxClick={handleMaxClick}
          isLoading={isLoading}
        />

        <PercentageSlider
          percentage={closePercentage}
          onSliderChange={handleSliderChange}
          onPercentageChange={handlePercentageChange}
          positionSize={position?.size || 0}
          isLoading={isLoading}
        />

        <ErrorDisplay error={error} />
      </div>

      <ClosePositionActionButtons isLoading={isLoading} onClose={onClose} onSubmit={handleSubmit} />
    </ModalBackdrop>
  );
}
