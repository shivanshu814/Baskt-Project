import { useMemo } from 'react';
import { Asset } from '../../types/asset';
import { UseAssetRenderingReturn } from '../../types/asset/rendering';
import { getDisplayAssets, getRemainingCount } from '../../utils/asset/asset';

export const useAssetRendering = (assets: Asset[]): UseAssetRenderingReturn => {
  const displayAssets = useMemo(() => getDisplayAssets(assets), [assets]);
  const remainingCount = useMemo(() => getRemainingCount(assets), [assets]);
  const shouldRenderMulti = useMemo(() => assets.length > 1, [assets]);

  return {
    displayAssets,
    remainingCount,
    shouldRenderMulti,
  };
};
