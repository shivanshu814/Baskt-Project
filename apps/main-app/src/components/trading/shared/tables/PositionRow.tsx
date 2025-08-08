import { NumberFormat } from '@baskt/ui';
import { Pencil } from 'lucide-react';
import { PositionRowProps } from '../../../../types/trading/components/tabs';
import {
  getPnlColor,
  getPositionTypeColor,
  getPositionTypeLabel,
} from '../../../../utils/formatters/formatters';

export function PositionRow({ position, onAddCollateral, onClosePosition }: PositionRowProps) {
  const { calculations } = position;
  const positionTypeLabel = getPositionTypeLabel(position.isLong);
  const positionTypeColor = getPositionTypeColor(position.isLong);
  const pnlColor = getPnlColor(calculations.pnl);

  const handleAddCollateralClick = () => {
    onAddCollateral(position);
  };

  const handleClosePositionClick = () => {
    onClosePosition(position);
  };

  return (
    <tr className="border-b border-border/50">
      <td className="py-2 px-2">
        <span className={positionTypeColor}>{positionTypeLabel}</span>
      </td>
      <td className="py-2 px-2">
        <NumberFormat value={position.size} isPrice={true} />
      </td>
      <td className="py-2 px-2">
        <NumberFormat value={calculations.positionValue} isPrice={true} showCurrency={true} />
      </td>
      <td className="py-2 px-2">
        <NumberFormat value={calculations.entryPrice} isPrice={true} showCurrency={true} />
      </td>
      <td className="py-2 px-2">
        <NumberFormat value={calculations.currentPrice} isPrice={true} showCurrency={true} />
      </td>
      <td className="whitespace-nowrap py-2 px-2">
        <span className={pnlColor}>
          {calculations.pnl >= 0 ? '+' : ''}
          <NumberFormat value={calculations.pnl} isPrice={true} showCurrency={true} /> (
          {calculations.pnl >= 0 ? '+' : ''}
          {calculations.pnlPercentage.toFixed(2)}%)
        </span>
      </td>
      <td className="py-2 px-2">
        <div className="flex items-center gap-1">
          <NumberFormat value={position.collateral} isPrice={true} showCurrency={true} />
          <button
            onClick={handleAddCollateralClick}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Pencil size={12} />
          </button>
        </div>
      </td>
      <td className="py-2 px-2">
        <NumberFormat value={calculations.fees} isPrice={true} showCurrency={true} />
      </td>
      <td className="py-2 px-2">
        <button
          onClick={handleClosePositionClick}
          className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition-colors"
        >
          Close
        </button>
      </td>
    </tr>
  );
}
