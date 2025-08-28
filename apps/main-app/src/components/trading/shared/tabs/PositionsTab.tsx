'use client';

import {
  NumberFormat,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useUser,
} from '@baskt/ui';
import { Pencil } from 'lucide-react';
import { useGetPositions } from '../../../../hooks/trade/action/position/getPositions';
import { PositionsTabProps } from '../../../../types/baskt/trading/components/tabs';
import {
  getPnlColor,
  getPositionTypeColor,
  getPositionTypeLabel,
} from '../../../../utils/formatters/formatters';

export function PositionsTab({ baskt, onAddCollateral, onClosePosition }: PositionsTabProps) {
  const { userAddress } = useUser();
  const { positions, loading, error } = useGetPositions(
    baskt?.price || 0,
    baskt?.basktId,
    userAddress,
  );

  const handleAddCollateralClick = (position: any) => {
    onAddCollateral(position);
  };

  const handleClosePositionClick = (position: any) => {
    onClosePosition(position);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading positions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading positions: {error.message}</p>
      </div>
    );
  }

  const hasPositions = positions && positions.length > 0;

  return (
    <div className="overflow-x-auto -mt-4 -ml-2">
      <Table>
        <TableHeader className="bg-zinc-900">
          <TableRow>
            <TableHead className="p-2 h-8 text-text">Long/Short</TableHead>
            <TableHead className="p-2 h-8 text-text">Position Value</TableHead>
            <TableHead className="p-2 h-8 text-text">Entry Price</TableHead>
            <TableHead className="p-2 h-8 text-text">Current Price</TableHead>
            <TableHead className="p-2 h-8 text-text">PNL (ROE) %</TableHead>
            <TableHead className="p-2 h-8 text-text">Collateral</TableHead>
            <TableHead className="p-2 h-8 text-text">Fees</TableHead>
            <TableHead className="p-2 h-8 text-text">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!hasPositions ? (
            <TableRow>
              <TableCell colSpan={8} className="py-8 p-2 text-center text-muted-foreground">
                No positions found
              </TableCell>
            </TableRow>
          ) : (
            positions.map((position: any, index: number) => {
              const positionTypeLabel = getPositionTypeLabel(position.isLong);
              const positionTypeColor = getPositionTypeColor(position.isLong);
              const pnlColor = getPnlColor(position.pnl);

              return (
                <TableRow key={index}>
                  <TableCell className="p-2">
                    <span className={positionTypeColor}>{positionTypeLabel}</span>
                  </TableCell>
                  <TableCell className="p-2">
                    <NumberFormat
                      value={position.positionValue}
                      isPrice={true}
                      showCurrency={true}
                    />
                  </TableCell>
                  <TableCell className="p-2">
                    <NumberFormat value={position.entryPrice} isPrice={true} showCurrency={true} />
                  </TableCell>
                  <TableCell className="p-2">
                    <NumberFormat
                      value={position.currentPrice}
                      isPrice={true}
                      showCurrency={true}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap p-2">
                    <span className={pnlColor}>
                      {position.pnl >= 0 ? '+' : ''}
                      <NumberFormat value={position.pnl} isPrice={true} showCurrency={true} /> (
                      {position.pnl >= 0 ? '+' : ''}
                      {position.pnlPercentage.toFixed(2)}%)
                    </span>
                  </TableCell>
                  <TableCell className="p-2">
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
                  </TableCell>
                  <TableCell className="p-2">
                    <NumberFormat value={position.fees} isPrice={true} showCurrency={true} />
                  </TableCell>
                  <TableCell className="p-2">
                    <button
                      onClick={() => handleClosePositionClick(position)}
                      className="text-xs px-2 py-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition-colors"
                    >
                      Close
                    </button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
