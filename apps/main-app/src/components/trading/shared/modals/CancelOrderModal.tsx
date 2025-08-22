'use client';

import { Button, NumberFormat } from '@baskt/ui';
import { X } from 'lucide-react';
import { useCancelOrder } from '../../../../hooks/trade/action/use-cancel-order';
import { CancelOrderModalProps } from '../../../../types/baskt/trading/modals';
import { ModalBackdrop } from './ModalBackdrop';

export function CancelOrderModal({ isOpen, onClose, order }: CancelOrderModalProps) {
  const { isLoading, handleCancel } = useCancelOrder(order, onClose);
  const orderType = order?.isLong ? 'Long' : 'Short';
  const orderTypeColor = order?.isLong ? 'text-green-500' : 'text-red-500';
  const orderSize = order?.size || 0;
  const orderCollateral = order?.collateral || 0;

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-foreground">Cancel Order</h3>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted/50"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6">
        <div className="text-left">
          <p className="text-muted-foreground mb-4">Are you sure you want to cancel this order?</p>
        </div>

        <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Order Type</span>
              <span className={`font-semibold ${orderTypeColor}`}>{orderType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Position Value</span>
              <span className="font-semibold text-foreground">
                <NumberFormat value={orderSize} isPrice={true} />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Collateral</span>
              <span className="font-semibold text-foreground">
                <NumberFormat value={orderCollateral} isPrice={true} showCurrency={true} />
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-border hover:bg-muted/50"
            disabled={isLoading}
          >
            Keep Order
          </Button>
          <Button
            onClick={handleCancel}
            className="flex-1 bg-primary text-white font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Cancelling...
              </div>
            ) : (
              'Cancel Order'
            )}
          </Button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
