'use client';

import { NumberFormat } from '@baskt/ui';
import React, { useCallback, useMemo } from 'react';
import { AssetRowProps } from '../../../types/baskt';
import { generateAssetUrl, handleAssetClick } from '../../../utils/asset/asset';
import { AssetLogo } from '../../create-baskt/assetModal/AssetLogo';

export const AssetRow = React.memo(({ asset, currentWeight }: AssetRowProps) => {
  const assetUrl = useMemo(() => generateAssetUrl(asset), [asset]);

  const handleClick = useCallback(() => {
    handleAssetClick(asset);
  }, [asset]);

  return (
    <div className="flex items-center px-2 sm:px-3 py-2 border-t border-border bg-background/80 text-xs sm:text-sm">
      <span className="flex-1 flex items-center">
        <span className="mr-2">
          <AssetLogo
            ticker={asset.ticker || asset.name || 'Asset'}
            logo={asset.logo || ''}
            size="sm"
          />
        </span>
        <button
          onClick={handleClick}
          disabled={!assetUrl}
          className={`truncate font-medium ${
            assetUrl ? 'hover:underline cursor-pointer' : 'cursor-default'
          }`}
        >
          {asset.ticker || asset.name}
        </button>
      </span>
      <span className="flex-1 text-center">
        {asset.price !== undefined ? (
          <NumberFormat value={asset.price} isPrice={true} showCurrency={true} />
        ) : (
          '-'
        )}
      </span>
      <span className="flex-1 text-center">
        <span className={asset.direction ? 'text-green-600' : 'text-red-600'}>
          {asset.direction ? 'Long' : 'Short'}
        </span>
      </span>
      <span className="flex-1 text-center">
        {asset.weight !== undefined ? <NumberFormat value={asset.weight} /> : '-'}%
      </span>
      <span className="flex-1 text-right">
        {currentWeight !== undefined ? <NumberFormat value={currentWeight} /> : '-'}%
      </span>
    </div>
  );
});

AssetRow.displayName = 'AssetRow';
