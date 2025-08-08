import { NumberFormat } from '@baskt/ui';
import { Pencil } from 'lucide-react';
import React from 'react';
import { PositionsTableProps } from '../../../../types/trading/orders';
import { calculatePositionDetails } from '../../../../utils/calculation/calculations';
import { formatPositionType, getPositionTypeColor } from '../../../../utils/formatters/formatters';

export const PositionsTable: React.FC<PositionsTableProps> = ({
  positions,
  currentPrice,
  onAddCollateral,
  onClosePosition,
}) => {
  if (positions.length === 0) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="sticky top-0 bg-zinc-900/95 z-10 border-b border-border">
            <tr>
              <th className="text-left py-2 px-2">Long/Short</th>
              <th className="text-left py-2 px-2">Size</th>
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
            <tr>
              <td colSpan={9} className="py-8 px-2 text-center text-muted-foreground">
                No positions found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[800px]">
        <thead className="sticky top-0 bg-zinc-900/95 z-10 border-b border-border">
          <tr>
            <th className="text-left py-2 px-2">Long/Short</th>
            <th className="text-left py-2 px-2">Size</th>
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
          {positions.map((position, index) => {
            const positionDetails = calculatePositionDetails(position, currentPrice);

            return (
              <tr key={index} className="border-b border-border/50">
                <td className="py-2 px-2">
                  <span className={getPositionTypeColor(position.isLong)}>
                    {formatPositionType(position.isLong)}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <NumberFormat value={position.size} isPrice={true} />
                </td>
                <td className="py-2 px-2">
                  <NumberFormat
                    value={positionDetails.positionValue}
                    isPrice={true}
                    showCurrency={true}
                  />
                </td>
                <td className="py-2 px-2">
                  <NumberFormat
                    value={position.entryPrice || currentPrice}
                    isPrice={true}
                    showCurrency={true}
                  />
                </td>
                <td className="py-2 px-2">
                  <NumberFormat value={currentPrice} isPrice={true} showCurrency={true} />
                </td>
                <td className="whitespace-nowrap py-2 px-2">
                  <span className={positionDetails.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {positionDetails.pnl >= 0 ? '+' : ''}
                    <NumberFormat
                      value={positionDetails.pnl}
                      isPrice={true}
                      showCurrency={true}
                    />{' '}
                    ({positionDetails.pnl >= 0 ? '+' : ''}
                    {positionDetails.pnlPercentage.toFixed(2)}%)
                  </span>
                </td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1">
                    <NumberFormat value={position.collateral} isPrice={true} showCurrency={true} />
                    <button
                      onClick={() => onAddCollateral(position)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                </td>
                <td className="py-2 px-2">
                  <NumberFormat value={positionDetails.fees} isPrice={true} showCurrency={true} />
                </td>
                <td className="py-2 px-2">
                  <button
                    onClick={() => onClosePosition(position)}
                    className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition-colors"
                  >
                    Close
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
