import { OnchainAssetConfig } from '@baskt/types';
import BN from 'bn.js';

export const NAV_PRECISION = new BN(10 ** 6).mul(new BN(100)); // 10^8 = 100 * 10^6 to account for BASE_NAV of 100
export const WEIGHT_PRECISION = new BN(10 ** 4);

// TODO: What happens if there is an asset with one huge loss and making the price zero or negative
export function calculateNav(
  baseline: OnchainAssetConfig[],
  current: OnchainAssetConfig[],
  currentNav: BN,
) {
  try {
    let newNav = currentNav.clone();
    let navChange = new BN(0);

    for (let i = 0; i < current.length; i++) {
      const asset = current[i];
      const baselineAsset = baseline[i];
      const priceChange = asset.baselinePrice.sub(baselineAsset.baselinePrice); // in 1e9
      const relativePriceChange = priceChange; // There is technicall a div(baselineAsset.price) here but we are not doing it to preservice BN precision
      const weightedPriceChange = relativePriceChange.mul(new BN(asset.weight));
      const directionalChange = weightedPriceChange.mul(new BN(asset.direction ? 1 : -1));

      const netChange = currentNav.mul(directionalChange).div(baselineAsset.baselinePrice);
      navChange = navChange.add(netChange);
    }
    // in weightPriceChange we multiply by weight which is WEIGHT_PRECISION so we need to remove it from the nav here
    newNav = newNav.add(navChange.div(WEIGHT_PRECISION));
    return newNav.lte(new BN(0)) ? new BN(0) : newNav;
  } catch (error) {
    console.error('❌ calculateNav - Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return currentNav;
  }
}
