'use client';

import { X } from 'lucide-react';
import { useCancelOrder } from '../../../../hooks/trading/actions/use-cancel-order';
import { CancelOrderModalProps } from '../../../../types/trading/modals';
import { OrderInfoCard } from '../cards/OrderInfoCard';
import { ModalActionButtons } from './ModalActionButtons';
import { ModalBackdrop } from './ModalBackdrop';

export function CancelOrderModal({ isOpen, onClose, order }: CancelOrderModalProps) {
  const { isLoading, handleCancel } = useCancelOrder(order, onClose);

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

        <OrderInfoCard order={order} />

        <ModalActionButtons isLoading={isLoading} onClose={onClose} onCancel={handleCancel} />
      </div>
    </ModalBackdrop>
  );
}
