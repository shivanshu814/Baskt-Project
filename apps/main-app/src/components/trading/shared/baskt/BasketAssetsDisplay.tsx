import Image from 'next/image';
import React, { useMemo } from 'react';
import { BasketAssetsDisplayProps } from '../../../../types/baskt';
import {
  getAssetDisplayName,
  getDisplayAssets,
  getRemainingCount,
  handleImageError,
  isValidImageUrl,
} from '../../../../utils/asset/asset';

export const BasketAssetsDisplay: React.FC<BasketAssetsDisplayProps> = ({ assets }) => {
  const displayAssets = useMemo(() => getDisplayAssets(assets as any), [assets]);
  const remainingCount = useMemo(() => getRemainingCount(assets as any), [assets]);
  const hasAssets = useMemo(() => Boolean(assets && assets.length > 0), [assets]);
  const isSingleAsset = useMemo(() => displayAssets.length === 1, [displayAssets]);

  if (!hasAssets) {
    return <span className="text-xs font-bold text-muted-foreground">B</span>;
  }

  if (isSingleAsset) {
    return (
      <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center border border-border/20 overflow-hidden">
        {isValidImageUrl(displayAssets[0].logo) ? (
          <Image
            src={displayAssets[0].logo || ''}
            alt={displayAssets[0].ticker || displayAssets[0].name || 'Asset'}
            width={32}
            height={32}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : null}
        <span className="text-xs font-bold text-muted-foreground">
          {getAssetDisplayName(displayAssets[0])}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center">
      {assets.map((asset, index) => (
        <div
          key={asset.ticker || asset.name || index}
          className="w-6 h-6 rounded-full bg-muted/30 flex items-center justify-center border border-border/20 overflow-hidden"
          style={{ marginLeft: index > 0 ? '-12px' : '0' }}
          title={asset.ticker || asset.name}
        >
          {isValidImageUrl(asset.logo) ? (
            <Image
              src={asset.logo || ''}
              alt={asset.ticker || asset.name || 'Asset'}
              width={24}
              height={24}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : null}
        </div>
      ))}
      {remainingCount > 0 && (
        <span className="text-[10px] text-muted-foreground font-medium ml-1">
          +{remainingCount}
        </span>
      )}
    </div>
  );
};
