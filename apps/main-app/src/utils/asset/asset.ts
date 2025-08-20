import { BasktAssetInfo } from '@baskt/types';
import { Asset } from '../../types/asset';

export const generateAssetUrl = (asset: any): string | null => {
  if (asset.config?.coingeckoId) {
    return `https://www.coingecko.com/en/coins/${asset.config.coingeckoId}`;
  }

  if (asset.config?.priceConfig?.provider) {
    const { name, id, chain } = asset.config.priceConfig.provider;

    switch (name.toLowerCase()) {
      case 'binance':
        return `https://www.binance.com/en/trade/${id}`;
      case 'dexcreener':
        return chain ? `https://dexcreener.com/${chain}/${id}` : `https://dexcreener.com/${id}`;
      case 'oxfun':
        return `https://ox.fun/trade/${id}`;
      default:
        return `https://${name.toLowerCase()}.com/${id}`;
    }
  }

  return null;
};

export const handleAssetClick = (asset: BasktAssetInfo) => {
  const assetUrl = generateAssetUrl(asset);
  if (assetUrl) {
    window.open(assetUrl, '_blank');
  }
};

export const getExtraAssetsCount = (
  assets: BasktAssetInfo[] | undefined,
  maxVisible: number = 3,
): number => {
  if (!assets) return 0;
  return Math.max(0, assets.length - maxVisible);
};

export const getVisibleAssets = (
  assets: BasktAssetInfo[] | undefined,
  maxVisible: number = 3,
): BasktAssetInfo[] => {
  if (!assets || assets.length === 0) return [];
  return assets.slice(0, maxVisible);
};

export const getAssetDisplayInfo = (
  assets: BasktAssetInfo[] | undefined,
  maxVisible: number = 3,
) => {
  const visibleAssets = getVisibleAssets(assets, maxVisible);
  const extraCount = getExtraAssetsCount(assets, maxVisible);

  return {
    visibleAssets,
    extraCount,
    hasExtraAssets: extraCount > 0,
  };
};

export const getAssetDisplayName = (asset: Asset): string => {
  return (asset.ticker || asset.name || 'A').substring(0, 2).toUpperCase();
};

export const getDisplayAssets = (assets: Asset[]): Asset[] => {
  return assets.slice(0, 2);
};

export const getRemainingCount = (assets: Asset[]): number => {
  return Math.max(0, assets.length - 2);
};

export const isValidImageUrl = (url?: string): boolean => {
  return Boolean(url && url.startsWith('http'));
};

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
  const target = e.currentTarget;
  target.style.display = 'none';
  const fallbackElement = target.nextElementSibling;
  if (fallbackElement) {
    fallbackElement.classList.remove('hidden');
  }
};
