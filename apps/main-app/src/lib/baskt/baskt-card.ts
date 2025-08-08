import { calculateCurrentWeights } from '@baskt/sdk/src/math/weight';
import { BasktAssetInfo } from '@baskt/types';

/**
 * Calculates the current weights for a baskt.
 * @param assets - The assets to calculate the current weights for.
 * @returns The current weights for the baskt.
 */
export const calculateCurrentWeightsForBaskt = (assets: BasktAssetInfo[]) => {
  if (
    assets.length === 0 ||
    assets.some((a: any) => a.price === undefined || a.baselinePrice === undefined) //eslint-disable-line
  ) {
    return assets.map((asset: any) => asset.weight); //eslint-disable-line
  }

  // eslint-disable-next-line
  const basktAssets = assets.map((asset: any) => ({
    id: asset.id || asset.assetAddress || '',
    name: asset.name || '',
    ticker: asset.ticker || '',
    price: asset.price || 0,
    change24h: asset.change24h || 0,
    volume24h: asset.volume24h || 0,
    marketCap: asset.marketCap || 0,
    assetAddress: asset.assetAddress || asset.id || '',
    logo: asset.logo || '',
    weight: asset.weight || 0,
    direction: asset.direction || true,
    baselinePrice: asset.baselinePrice || asset.price || 0,
  }));

  return calculateCurrentWeights(basktAssets);
};
