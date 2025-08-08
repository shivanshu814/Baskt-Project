import React from 'react';
import { useBasketAssets } from '../../../../hooks/shared/use-basket-assets';
import { BasketAssetsDisplayProps } from '../../../../types/baskt';
import { MultiAssetRenderer } from './MultiAssetRenderer';
import { SingleAssetRenderer } from './SingleAssetRenderer';

export const BasketAssetsDisplay: React.FC<BasketAssetsDisplayProps> = ({ assets }) => {
  // eslint-disable-next-line
  const { displayAssets, remainingCount, hasAssets, isSingleAsset } = useBasketAssets(
    assets as any,
  );

  if (!hasAssets) {
    return <span className="text-xs font-bold text-muted-foreground">B</span>;
  }

  if (isSingleAsset) {
    // eslint-disable-next-line
    return <SingleAssetRenderer asset={displayAssets[0] as any} />;
  }

  return <MultiAssetRenderer assets={displayAssets} remainingCount={remainingCount} />;
};
