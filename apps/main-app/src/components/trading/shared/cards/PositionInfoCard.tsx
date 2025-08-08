import { Button, Input, NumberFormat } from '@baskt/ui';
import { usePositionInfo } from '../../../../hooks/trading/cards/use-position-info';
import { PositionInfoCardProps } from '../../../../types/trading/components/tabs';

export function PositionInfoCard({
  position,
  closeAmount,
  onAmountChange,
  onMaxClick,
  isLoading,
}: PositionInfoCardProps) {
  const { positionType, positionTypeColor, formattedCloseAmount, positionSize } = usePositionInfo(
    position,
    closeAmount,
  );

  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Position Type</span>
          <span className={positionTypeColor}>{positionType}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Position Size</span>
          <span className="font-semibold text-foreground">
            <NumberFormat value={positionSize} isPrice={true} />
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
              value={formattedCloseAmount}
              onChange={(e) => onAmountChange(e.target.value)}
              required
              min="0.01"
              step="0.01"
              max={positionSize}
              aria-label="Amount to close"
              autoFocus
              disabled={isLoading}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 py-1 text-xs hover:bg-muted border-none"
              onClick={onMaxClick}
              disabled={isLoading}
            >
              Max
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
