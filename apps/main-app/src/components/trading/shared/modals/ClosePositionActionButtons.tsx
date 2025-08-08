import { Button } from '@baskt/ui';
import { ClosePositionActionButtonsProps } from '../../../../types/trading/components/tabs';

export function ClosePositionActionButtons({
  isLoading,
  onClose,
  onSubmit,
}: ClosePositionActionButtonsProps) {
  return (
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
        onClick={onSubmit}
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
  );
}
