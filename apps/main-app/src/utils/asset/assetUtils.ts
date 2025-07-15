/**
 * Utility function to generate hyperlink URL based on asset configuration
 * @param asset - Asset object with config and coingeckoId
 * @returns URL string or null if no valid URL can be generated
 */
export const generateAssetUrl = (asset: any): string | null => {
  // If coingeckoId is available, use CoinGecko
  if (asset.coingeckoId) {
    return `https://www.coingecko.com/en/coins/${asset.coingeckoId}`;
  }

  // If priceConfig is available, use the provider configuration
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
        // For other providers, try to construct a generic URL
        return `https://${name.toLowerCase()}.com/${id}`;
    }
  }

  return null;
};
