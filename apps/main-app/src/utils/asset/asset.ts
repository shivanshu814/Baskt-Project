import { BasktAssetInfo } from '@baskt/types';
import { Asset } from '../../types/asset';

/**
 * Utility function to generate hyperlink URL based on asset configuration
 * @param asset - Asset object with config and coingeckoId
 * @returns URL string or null if no valid URL can be generated
 */
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

/**
 * Handles the click event for an asset.
 * @param asset - The asset to handle.
 */
export const handleAssetClick = (asset: BasktAssetInfo) => {
  const assetUrl = generateAssetUrl(asset);
  if (assetUrl) {
    window.open(assetUrl, '_blank');
  }
};

/**
 * Gets the number of assets in a baskt.
 * @param assets - The assets to get the count of.
 * @returns The number of assets.
 */
export const getAssetCount = (assets: BasktAssetInfo[] | undefined): number => {
  return assets?.length || 0;
};

/**
 * Gets the images of the assets in a baskt.
 * @param assets - The assets to get the images of.
 * @param maxVisible - The maximum number of assets to get the images of.
 * @returns The images of the assets.
 */
export const getAssetImages = (
  assets: BasktAssetInfo[] | undefined,
  maxVisible: number = 3,
): BasktAssetInfo[] => {
  if (!assets || assets.length === 0) return [];
  return assets.slice(0, maxVisible);
};

/**
 * Gets the number of extra assets in a baskt.
 * @param assets - The assets to get the extra count of.
 * @param maxVisible - The maximum number of assets to get the extra count of.
 * @returns The number of extra assets.
 */
export const getExtraAssetsCount = (
  assets: BasktAssetInfo[] | undefined,
  maxVisible: number = 3,
): number => {
  if (!assets) return 0;
  return Math.max(0, assets.length - maxVisible);
};

/**
 * Gets the visible assets from a list.
 * @param assets - The assets to get the visible ones from.
 * @param maxVisible - The maximum number of assets to get.
 * @returns The visible assets.
 */
export const getVisibleAssets = (
  assets: BasktAssetInfo[] | undefined,
  maxVisible: number = 3,
): BasktAssetInfo[] => {
  if (!assets || assets.length === 0) return [];
  return assets.slice(0, maxVisible);
};

/**
 * Gets asset display information including visible assets and extra count.
 * @param assets - The assets to get display info for.
 * @param maxVisible - The maximum number of assets to show.
 * @returns Object with visible assets, extra count, and hasExtraAssets flag.
 */
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

/**
 * Formats the asset count.
 * @param count - The number of assets.
 * @returns The formatted asset count.
 */
export const formatAssetCount = (count: number): string => {
  return `${count} asset${count !== 1 ? 's' : ''}`;
};

/**
 * Gets the display name for an asset.
 * @param asset - The asset to get the display name for.
 * @returns The display name.
 */
export const getAssetDisplayName = (asset: Asset): string => {
  return (asset.ticker || asset.name || 'A').substring(0, 2).toUpperCase();
};

/**
 * Gets the display assets from a list.
 * @param assets - The assets to get the display ones from.
 * @returns The display assets.
 */
export const getDisplayAssets = (assets: Asset[]): Asset[] => {
  return assets.slice(0, 2);
};

/**
 * Gets the remaining count of assets.
 * @param assets - The assets to get the remaining count of.
 * @returns The remaining count.
 */
export const getRemainingCount = (assets: Asset[]): number => {
  return Math.max(0, assets.length - 2);
};

/**
 * Checks if a URL is a valid image URL.
 * @param url - The URL to check.
 * @returns True if the URL is valid, false otherwise.
 */
export const isValidImageUrl = (url?: string): boolean => {
  return Boolean(url && url.startsWith('http'));
};

/**
 * Handles image error events.
 * @param e - The error event.
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
  const target = e.currentTarget;
  target.style.display = 'none';
  const fallbackElement = target.nextElementSibling;
  if (fallbackElement) {
    fallbackElement.classList.remove('hidden');
  }
};
