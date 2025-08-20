'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@baskt/ui';
import React from 'react';
import { BasktCardRebalancingProps } from '../../../types/baskt';

export const BasktCardRebalancing = React.memo(({ rebalance }: BasktCardRebalancingProps) => {
  return (
    <div className="mt-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-tertiary">Rebalancing</h3>
      </div>
      <div className="rounded-sm border border-border bg-muted/10 overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="border-border">
              <TableHead className="text-xs sm:text-sm font-semibold text-muted-foreground text-left">
                Rebalancing Mode
              </TableHead>
              <TableHead className="text-xs sm:text-sm font-semibold text-muted-foreground text-center">
                Rebalancing Period
              </TableHead>
              <TableHead className="text-xs sm:text-sm font-semibold text-muted-foreground text-right">
                Last Rebalanced Time
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="border-border bg-background/80">
              <TableCell className="text-xs sm:text-sm font-semibold text-left">
                {rebalance?.rebalancingMode || 'Automatic'}
              </TableCell>
              <TableCell className="text-xs sm:text-sm font-semibold text-center">
                {rebalance?.rebalancingPeriod || 'Daily'}
              </TableCell>
              <TableCell className="text-xs sm:text-sm font-semibold text-right">
                {rebalance?.lastRebalanceTime
                  ? new Date(rebalance.lastRebalanceTime * 1000).toLocaleDateString()
                  : 'Never'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

BasktCardRebalancing.displayName = 'BasktCardRebalancing';
