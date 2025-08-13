'use client';

import { usePositionsTab } from '../../../../hooks/trading/tabs/use-positions-tab';
import { PositionsTabProps } from '../../../../types/trading/components/tabs';
import { PositionRow } from '../tables/PositionRow';

export function PositionsTab({
  baskt,
  positions,
  onAddCollateral,
  onClosePosition,
}: PositionsTabProps) {
  const { processedPositions, hasPositions } = usePositionsTab(positions, baskt?.price || 0);

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
              <td colSpan={9} className="py-8 px-2 text-center text-muted-foreground">
                No positions found
              </td>
            </tr>
          ) : (
            processedPositions.map((position, index) => (
              <PositionRow
                key={index}
                position={position}
                baskt={baskt}
                onAddCollateral={onAddCollateral}
                onClosePosition={onClosePosition}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
