import { useMemo } from 'react';
import { Asset } from '../../types/asset';
import { getDisplayAssets, getRemainingCount } from '../../utils/asset/asset';

export const useBasketAssets = (assets: Asset[]) => {
  const displayAssets = useMemo(() => getDisplayAssets(assets), [assets]);
  const remainingCount = useMemo(() => getRemainingCount(assets), [assets]);
  const hasAssets = useMemo(() => Boolean(assets && assets.length > 0), [assets]);
  const isSingleAsset = useMemo(() => displayAssets.length === 1, [displayAssets]);

  return {
    displayAssets,
    remainingCount,
    hasAssets,
    isSingleAsset,
  };
};
