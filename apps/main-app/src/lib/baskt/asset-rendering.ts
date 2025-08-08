import { Asset } from '../../types/asset';
import { AssetData, RenderType } from '../../types/asset/rendering';
import { getDisplayAssets, getRemainingCount } from '../../utils/asset/asset';

export const determineRenderType = (assets: Asset[]): RenderType => {
  return assets.length > 1 ? 'multi' : 'single';
};

export const prepareAssetData = (assets: Asset[]): AssetData => {
  const displayAssets = getDisplayAssets(assets);
  const remainingCount = getRemainingCount(assets);
  const renderType = determineRenderType(assets);

  return {
    displayAssets,
    remainingCount,
    renderType,
  };
};

export const getAssetKey = (asset: Asset, index: number): string => {
  return asset.ticker || asset.name || `asset-${index}`;
};
