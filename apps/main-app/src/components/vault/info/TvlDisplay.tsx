'use client';
import { NumberFormat } from '@baskt/ui';
import React from 'react';
import { TvlDisplayProps } from '../../../types/vault';

export const TvlDisplay = React.memo<TvlDisplayProps>(({ actualTvl }) => {
  return (
    <div className="flex items-end justify-between mb-2">
      <div className="text-lg font-semibold text-foreground">Liquidity Allocation</div>
      <div className="flex flex-col items-end">
        <span className="text-xs font-medium text-muted-foreground">Total value locked</span>
        <span className="text-2xl font-bold text-primary">
          <NumberFormat value={Number(actualTvl) * 1e6} isPrice={true} showCurrency={true} />
        </span>
      </div>
    </div>
  );
});

TvlDisplay.displayName = 'TvlDisplay';
