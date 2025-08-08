'use client';

import { NumberFormat, useBasktClient } from '@baskt/ui';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { usePortfolioPositions } from '../../hooks/portfolio/use-portfolio-positions';
import { SortDirection, SortField } from '../../types/components/ui/ui';

export const PositionsTable = () => {
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();
  const { positions, isLoading, isError } = usePortfolioPositions();
  const [sortField, setSortField] = useState<SortField>('basket');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  if (!userAddress) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Please connect your wallet to view positions</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading positions...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load positions</p>
      </div>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedPositions = () => {
    return [...positions].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'basket':
          aValue = a.basktName;
          bValue = b.basktName;
          break;
        case 'size':
          aValue = Number(a.size);
          bValue = Number(b.size);
          break;
        case 'positionValue':
          aValue = Number(a.usdcSize) / 1e6;
          bValue = Number(b.usdcSize) / 1e6;
          break;
        case 'entryPrice':
          aValue = Number(a.entryPrice) / 1e6;
          bValue = Number(b.entryPrice) / 1e6;
          break;
        case 'currentPrice':
          aValue = a.currentPrice || 0;
          bValue = b.currentPrice || 0;
          break;
        case 'pnl':
          aValue = a.pnl || 0;
          bValue = b.pnl || 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-300" />
    ) : (
      <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
    );
  };

  const getPositionTypeColor = (isLong: boolean) => {
    return isLong ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const getPositionTypeLabel = (isLong: boolean) => {
    return isLong ? 'Long' : 'Short';
  };

  const sortedPositions = getSortedPositions();

  if (sortedPositions.length === 0) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="sticky top-0 bg-zinc-900/95 z-10 border-b border-border">
            <tr>
              <th className="text-left py-2 px-2">
                <button
                  onClick={() => handleSort('basket')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Baskt
                  <SortIcon field="basket" />
                </button>
              </th>
              <th className="text-left py-2 px-2">
                <button
                  onClick={() => handleSort('size')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Type
                  <SortIcon field="size" />
                </button>
              </th>
              <th className="text-left py-2 px-2">
                <button
                  onClick={() => handleSort('positionValue')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Position Value
                  <SortIcon field="positionValue" />
                </button>
              </th>
              <th className="text-left py-2 px-2">
                <button
                  onClick={() => handleSort('entryPrice')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Entry Price
                  <SortIcon field="entryPrice" />
                </button>
              </th>
              <th className="text-left py-2 px-2">
                <button
                  onClick={() => handleSort('currentPrice')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Current Price
                  <SortIcon field="currentPrice" />
                </button>
              </th>
              <th className="text-left py-2 px-2">
                <button
                  onClick={() => handleSort('pnl')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  PnL
                  <SortIcon field="pnl" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="text-center py-8">
                <p className="text-muted-foreground">No positions found</p>
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
            <th className="text-left py-2 px-2">
              <button
                onClick={() => handleSort('basket')}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Baskt
                <SortIcon field="basket" />
              </button>
            </th>
            <th className="text-left py-2 px-2">
              <button
                onClick={() => handleSort('size')}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Type
                <SortIcon field="size" />
              </button>
            </th>
            <th className="text-left py-2 px-2">
              <button
                onClick={() => handleSort('positionValue')}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Position Value
                <SortIcon field="positionValue" />
              </button>
            </th>
            <th className="text-left py-2 px-2">
              <button
                onClick={() => handleSort('entryPrice')}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Entry Price
                <SortIcon field="entryPrice" />
              </button>
            </th>
            <th className="text-left py-2 px-2">
              <button
                onClick={() => handleSort('currentPrice')}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Current Price
                <SortIcon field="currentPrice" />
              </button>
            </th>
            <th className="text-left py-2 px-2">
              <button
                onClick={() => handleSort('pnl')}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                PnL
                <SortIcon field="pnl" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedPositions.map((position) => (
            <tr key={position.positionId} className="border-b border-border/50 hover:bg-muted/50">
              <td className="py-2 px-2">
                <span className="text-sm font-medium">{position.basktName}</span>
              </td>
              <td className="py-2 px-2">
                <span className={`text-sm font-medium ${getPositionTypeColor(position.isLong)}`}>
                  {getPositionTypeLabel(position.isLong)}
                </span>
              </td>
              <td className="py-2 px-2">
                <NumberFormat
                  value={Number(position.usdcSize)}
                  isPrice={true}
                  showCurrency={true}
                />
              </td>
              <td className="py-2 px-2">
                <NumberFormat
                  value={Number(position.entryPrice)}
                  isPrice={true}
                  showCurrency={true}
                />
              </td>
              <td className="py-2 px-2">
                <NumberFormat
                  value={position.currentPrice ? position.currentPrice * 1e6 : 0}
                  isPrice={true}
                  showCurrency={true}
                />
              </td>
              <td className="py-2 px-2">
                <span
                  className={`text-sm font-medium ${
                    position.pnl && position.pnl >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {position.pnl !== undefined ? (
                    <>
                      {position.pnl >= 0 ? '+' : ''}
                      <NumberFormat
                        value={position.pnl * 1e6}
                        isPrice={true}
                        showCurrency={true}
                      />{' '}
                      (
                      {position.pnlPercentage !== undefined
                        ? (position.pnlPercentage >= 0 ? '+' : '') +
                          position.pnlPercentage.toFixed(2)
                        : '0.00'}
                      %)
                    </>
                  ) : (
                    '---'
                  )}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
