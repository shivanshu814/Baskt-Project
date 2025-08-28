'use client';

import {
  NumberFormat,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useBasktClient,
} from '@baskt/ui';
import { usePositionHistory } from '../../../hooks/trade/action/position-history/getPositionHistory';
import { formatOrderTime } from '../../../utils/formatters/formatters';

export function OrderHistoryTable() {
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();
  const { history: historyData, isLoading, error } = usePositionHistory(undefined, userAddress);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading position history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading position history: {error.message}</p>
      </div>
    );
  }

  if (!historyData || historyData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No position history found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="whitespace-nowrap">Entry Time</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead className="whitespace-nowrap">Position Size</TableHead>
            <TableHead className="whitespace-nowrap">Entry Price</TableHead>
            <TableHead className="whitespace-nowrap">Exit Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="whitespace-nowrap">Total PnL</TableHead>
            <TableHead className="text-right whitespace-nowrap">Total Fees</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {historyData.map((position: any, index: number) => (
            <TableRow key={position.positionId || index}>
              <TableCell>
                <div className="text-xs">
                  <div className="">
                    {formatOrderTime(position.entryTime || new Date().toISOString())}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className={position.isLong ? 'text-green-500' : 'text-red-500'}>
                  {position.isLong ? 'Long' : 'Short'}
                </span>
              </TableCell>
              <TableCell>
                <NumberFormat value={position.size} isPrice={true} />
              </TableCell>
              <TableCell>
                <NumberFormat value={position.entryPrice} isPrice={true} showCurrency={true} />
              </TableCell>
              <TableCell>
                <NumberFormat
                  value={position.averageExitPrice}
                  isPrice={true}
                  showCurrency={true}
                />
              </TableCell>
              <TableCell>
                <span className="text-sm">{position.status || 'Unknown'}</span>
              </TableCell>
              <TableCell>
                <span
                  className={
                    Number(position.totalPnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  }
                >
                  <NumberFormat value={position.totalPnl} isPrice={true} showCurrency={true} />
                </span>
              </TableCell>
              <TableCell className="text-right">
                <NumberFormat value={position.totalFees} isPrice={true} showCurrency={true} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
