'use client';

import {
  NumberFormat,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@baskt/ui';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { SortDirection, SortField } from '../../types/baskt/ui/ui';
import { PositionsTableProps } from '../../types/portfolio';

export const PositionsTable = ({ positions }: PositionsTableProps) => {
  const [sortField, setSortField] = useState<SortField>('baskt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  console.log(positions);
  if (!positions || positions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No positions found</p>
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
        case 'baskt':
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

  const getPositionTypeColor = (isLong: boolean) => {
    return !isLong ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
  };

  const getPositionTypeLabel = (isLong: boolean) => {
    return isLong ? 'Long' : 'Short';
  };

  const sortedPositions = getSortedPositions();

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Baskt</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Position Value</TableHead>
            <TableHead>Entry Price</TableHead>
            <TableHead>Current Price</TableHead>
            <TableHead>PnL</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPositions.map((position) => (
            <TableRow key={position.basktId}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/trade/${position.basktId}`}
                    className="group flex items-center gap-1 text-sm font-medium cursor-pointer text-white hover:underline"
                  >
                    {position.basktName}
                    <ExternalLink
                      size={14}
                      className="text-muted-foreground group-hover:text-primary"
                    />
                  </Link>
                </div>
              </TableCell>
              <TableCell>
                <span className={`text-sm font-medium ${getPositionTypeColor(position.isLong)}`}>
                  {getPositionTypeLabel(position.isLong)}
                </span>
              </TableCell>
              <TableCell>
                <NumberFormat
                  value={Number(position.positionValue)}
                  isPrice={true}
                  showCurrency={true}
                />
              </TableCell>
              <TableCell>
                <NumberFormat
                  value={Number(position.entryPrice)}
                  isPrice={true}
                  showCurrency={true}
                />
              </TableCell>
              <TableCell>
                <NumberFormat
                  value={position.currentPrice ? position.currentPrice : 0}
                  isPrice={true}
                  showCurrency={true}
                />
              </TableCell>
              <TableCell>
                <span
                  className={`text-sm font-medium ${
                    position.pnl && Number(position.pnl) >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {position.pnl !== undefined ? (
                    <>
                      {Number(position.pnl) >= 0 ? '+' : ''}
                      <NumberFormat
                        value={Number(position.pnl)}
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
