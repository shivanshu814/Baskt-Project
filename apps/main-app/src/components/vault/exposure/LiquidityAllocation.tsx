'use client';
import React, { useMemo } from 'react';
import { AssetExposure, LiquidityAllocationProps } from '../../../types/vault';
import { TvlDisplay } from '../info/TvlDisplay';
import { ExposureTable } from './ExposureTable';

export const LiquidityAllocation = React.memo(({ tvl }: LiquidityAllocationProps) => {
  const actualTvl = useMemo(() => {
    const numericTvl = parseFloat(tvl.replace(/,/g, ''));
    return (numericTvl / 1e6).toFixed(2);
  }, [tvl]);

  const assetExposureData: AssetExposure[] = [];

  return (
    <div className="flex flex-col gap-2">
      <TvlDisplay actualTvl={actualTvl} />
      <ExposureTable assetExposureData={assetExposureData} />
    </div>
  );
});

LiquidityAllocation.displayName = 'LiquidityAllocation';
