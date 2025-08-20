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
import React from 'react';
import { BasktCardMetricsProps } from '../../../types/baskt';

export const BasktCardMetrics = React.memo(({ metrics }: BasktCardMetricsProps) => {
  const performance = metrics?.performance || {};
  const openInterest = metrics?.openInterest || 0;

  return (
    <div className="mb-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-tertiary">Metrics</h3>
      </div>
      <div className="rounded-sm border border-border bg-muted/10 overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="border-border">
              <TableHead className="text-xs sm:text-sm font-semibold text-muted-foreground text-left">
                OI
              </TableHead>
              <TableHead className="text-xs sm:text-sm font-semibold text-muted-foreground text-center">
                Daily
              </TableHead>
              <TableHead className="text-xs sm:text-sm font-semibold text-muted-foreground text-center">
                Weekly
              </TableHead>
              <TableHead className="text-xs sm:text-sm font-semibold text-muted-foreground text-center">
                Monthly
              </TableHead>
              <TableHead className="text-xs sm:text-sm font-semibold text-right">
                Sharpe Ratio
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="border-border bg-background/80">
              <TableCell className="text-xs sm:text-sm font-semibold text-left">
                <NumberFormat
                  value={openInterest !== undefined ? openInterest : 0}
                  isPrice={true}
                  showCurrency={true}
                />
              </TableCell>
              <TableCell
                className={`text-xs sm:text-sm font-semibold text-center ${
                  performance.daily === 0
                    ? 'text-text'
                    : performance.daily > 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                {performance.daily !== undefined
                  ? `${performance.daily > 0 ? '+' : performance.daily < 0 ? '-' : ''}${Math.abs(
                      performance.daily,
                    ).toFixed(2)}%`
                  : '--'}
              </TableCell>
              <TableCell
                className={`text-xs sm:text-sm font-semibold text-center ${
                  performance.weekly === 0
                    ? 'text-text'
                    : performance.weekly > 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                {performance.weekly !== undefined
                  ? `${performance.weekly > 0 ? '+' : performance.weekly < 0 ? '-' : ''}${Math.abs(
                      performance.weekly,
                    ).toFixed(2)}%`
                  : '--'}
              </TableCell>
              <TableCell
                className={`text-xs sm:text-sm font-semibold text-center ${
                  performance.monthly === 0
                    ? 'text-text'
                    : performance.monthly > 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                {performance.monthly !== undefined
                  ? `${
                      performance.monthly > 0 ? '+' : performance.monthly < 0 ? '-' : ''
                    }${Math.abs(performance.monthly).toFixed(2)}%`
                  : '--'}
              </TableCell>
              <TableCell className="text-xs sm:text-sm font-semibold text-right">1.2</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

BasktCardMetrics.displayName = 'BasktCardMetrics';
