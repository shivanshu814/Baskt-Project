'use client';

import { useBasktRebalanceHistory } from '../../hooks/baskts/useBasktRebalanceHistory';
import { formatTimestamp, formatNumber } from '../../utils/format';
import { BASIS_POINT } from '../../constants/pool';
import { RebalanceHistoryTableProps } from '../../types/baskt';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  NumberFormat,
} from '@baskt/ui';

export function RebalanceHistoryTable({ basktId }: RebalanceHistoryTableProps) {
  const { rebalanceHistory, loading, error } = useBasktRebalanceHistory(basktId);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-20">
        <p className="text-white/60">Loading rebalance history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded">
        <p className="text-red-500 text-sm">{error.message}</p>
      </div>
    );
  }

  if (!rebalanceHistory || rebalanceHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-white/60">No rebalance history available for this Baskt</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Index</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead className="text-right">Baseline NAV</TableHead>
            <TableHead className="text-right">Assets</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rebalanceHistory.map((entry, index) => (
            <TableRow key={index}>
              <TableCell className="font-mono text-sm">{entry.rebalanceIndex.toString()}</TableCell>
              <TableCell>{formatTimestamp(entry.timestamp.toNumber())}</TableCell>
              <TableCell className="text-right">
                <NumberFormat value={entry.baselineNav.toNumber()} isPrice={true} />
              </TableCell>
              <TableCell className="text-right">
                <div className="text-sm">{entry.assetConfigs.length} assets</div>
                <div className="text-xs text-white/60">
                  {entry.assetConfigs.map((asset, assetIndex) => (
                    <div key={assetIndex} className="flex justify-between">
                      <span>{formatNumber(asset.weight.toNumber() / BASIS_POINT)}%</span>
                      <span className="ml-2">{asset.direction ? 'Long' : 'Short'}</span>
                    </div>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
