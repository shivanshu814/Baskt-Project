'use client';

import { BasktAssetInfo } from '@baskt/types';
import React from 'react';
import { BasktCardAssetsProps } from '../../../types/baskt';
import { AssetRow } from '../items/AssetRow';

export const BasktCardAssets = React.memo(({ baskt, currentWeights }: BasktCardAssetsProps) => {
  return (
    <div className="mt-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-tertiary">Assets</h3>
      </div>
      <div className="rounded-sm border border-border bg-muted/10 overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-muted-foreground">
            <span className="flex-1 text-left">
              Asset
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({baskt.assets?.length ?? 0})
              </span>
            </span>
            <span className="flex-1 text-center">Price</span>
            <span className="flex-1 text-center">Direction</span>
            <span className="flex-1 text-center whitespace-nowrap">Target Weight</span>
            <span className="flex-1 text-right whitespace-nowrap">Current Weight</span>
          </div>
          {(baskt.assets || []).map((asset: BasktAssetInfo, idx: number) => (
            <AssetRow
              key={`${asset.ticker || asset.name || idx}`}
              asset={asset}
              currentWeight={currentWeights[idx]}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

BasktCardAssets.displayName = 'BasktCardAssets';
