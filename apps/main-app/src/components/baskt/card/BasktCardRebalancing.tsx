'use client';

import React from 'react';
import { BasktCardRebalancingProps } from '../../../types/baskt';

export const BasktCardRebalancing = React.memo(({ baskt }: BasktCardRebalancingProps) => {
  return (
    <div className="mt-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-tertiary">Rebalancing</h3>
      </div>
      <div className="rounded-sm border border-border bg-muted/10 overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-muted-foreground">
            <span className="flex-1 text-left">Rebalancing Mode</span>
            <span className="flex-1 text-center">Rebalancing Period</span>
            <span className="flex-1 text-right">Last Rebalanced Time</span>
          </div>
          <div className="flex items-center px-2 sm:px-3 py-2 border-t border-border bg-background/80 text-xs sm:text-sm">
            <span className="flex-1 text-left font-semibold">
              {baskt.rebalancingMode || 'Automatic'}
            </span>
            <span className="flex-1 text-center font-semibold">
              {baskt.rebalancingPeriod || 'Daily'}
            </span>
            <span className="flex-1 text-right font-semibold">
              {baskt.lastRebalancedTime
                ? new Date(baskt.lastRebalancedTime).toLocaleString()
                : 'Never'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

BasktCardRebalancing.displayName = 'BasktCardRebalancing';
