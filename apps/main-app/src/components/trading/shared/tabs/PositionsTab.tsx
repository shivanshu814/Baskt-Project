'use client';

import { NumberFormat } from '@baskt/ui';
import { Pencil } from 'lucide-react';
import { usePositionsTab } from '../../../../hooks/trade/tabs/use-positions-tab';
import { PositionsTabProps } from '../../../../types/baskt/trading/components/tabs';
import {
  getPnlColor,
  getPositionTypeColor,
  getPositionTypeLabel,
} from '../../../../utils/formatters/formatters';

export function PositionsTab({
  baskt,
  positions,
  onAddCollateral,
  onClosePosition,
}: PositionsTabProps) {
  const { processedPositions, hasPositions } = usePositionsTab(positions, baskt?.price || 0);

  const handleAddCollateralClick = (position: any) => {
    onAddCollateral(position);
  };

  const handleClosePositionClick = (position: any) => {
    onClosePosition(position);
  };

  return (
    <div className="overflow-x-auto -mt-4 -ml-2">
      <table className="w-full text-sm min-w-[800px]">
        <thead className="sticky top-0 bg-zinc-900/95 z-10 border-b border-border">
          <tr>
            <th className="text-left py-2 px-2">Long/Short</th>
            <th className="text-left py-2 px-2 whitespace-nowrap">Position Value</th>
            <th className="text-left py-2 px-2 whitespace-nowrap">Entry Price</th>
            <th className="text-left py-2 px-2 whitespace-nowrap">Current Price</th>
            <th className="text-left py-2 px-2 whitespace-nowrap">PNL (ROE) %</th>
            <th className="text-left py-2 px-2">Collateral</th>
            <th className="text-left py-2 px-2">Fees</th>
            <th className="text-left py-2 px-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {!hasPositions ? (
            <tr>
              <td colSpan={8} className="py-8 px-2 text-center text-muted-foreground">
                No positions found
              </td>
            </tr>
          ) : (
            processedPositions.map((position, index) => {
              const { calculations } = position;
              const positionTypeLabel = getPositionTypeLabel(position.isLong);
              const positionTypeColor = getPositionTypeColor(position.isLong);
              const pnlColor = getPnlColor(calculations.pnl);

              return (
                <tr key={index} className="border-b border-border/50">
                  <td className="py-2 px-2">
                    <span className={positionTypeColor}>{positionTypeLabel}</span>
                  </td>
                  <td className="py-2 px-2">
                    <NumberFormat
                      value={calculations.positionValue}
                      isPrice={true}
                      showCurrency={true}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <NumberFormat
                      value={calculations.entryPrice}
                      isPrice={true}
                      showCurrency={true}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <NumberFormat
                      value={calculations.currentPrice}
                      isPrice={true}
                      showCurrency={true}
                    />
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
                      <NumberFormat
                        value={position.remainingCollateral}
                        isPrice={true}
                        showCurrency={true}
                      />
                      <button
                        onClick={() => handleAddCollateralClick(position)}
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
                      onClick={() => handleClosePositionClick(position)}
                      className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition-colors"
                    >
                      Close
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
