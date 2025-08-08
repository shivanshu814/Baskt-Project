import { Button } from '@baskt/ui';
import { ModalActionButtonsProps } from '../../../../types/trading/orders';

export function ModalActionButtons({ isLoading, onClose, onCancel }: ModalActionButtonsProps) {
  return (
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
        onClick={onCancel}
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
  );
}
