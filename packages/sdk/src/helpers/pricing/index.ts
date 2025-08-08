import { routePrice } from './providers';
import BN from 'bn.js';
import { AssetPriceProviderConfig, AssetPrice } from '@baskt/types';
import { PublicKey } from '@solana/web3.js';
import { calculateNav } from '../../math/nav';

export async function fetchTokenPrice(
  name: string,
  chain: string,
  id: string,
  units: number = 1,
): Promise<{
  priceUSD: BN;
} | null> {
  const prices = await routePrice(name, chain, id);
  if (!prices) {
    return null;
  }

  const multipliedPrice = prices.priceUSD.muln(units);


  return { priceUSD: multipliedPrice };
}

export async function fetchAssetPrices(tokens: AssetPriceProviderConfig[], addresses: string[]): Promise<(AssetPrice | null)[]> {

  const prices = await Promise.all(tokens.map(async (token, index) => {
    let prices;
    const priceProvider = token.provider;
    const units = (token as any).units || 1;

    prices = await fetchTokenPrice(
      priceProvider.name,
      priceProvider.chain,
      priceProvider.id,
      units,
    );

    if (!prices) {
      return null;
    }

    const priceUSD = prices.priceUSD;
    const timestamp = new Date().getTime();
    const data: AssetPrice = {
      priceUSD: priceUSD.toString(),
      assetId: token.provider.id,
      timestamp,
      assetAddress: addresses[index],
    };

    return data;
  }));


  return prices;
}

/**
 * Fetch current prices for assets in a baskt and calculate live NAV
 * @param basktAssets Array of asset configurations with price provider info
 * @param baselineNav Current baseline NAV
 * @returns Object containing live NAV and asset prices
 */
export async function calculateLiveNav(
  basktAssets: Array<{
    assetId: string;
    weight: BN;
    direction: number;
    baselinePrice: BN;
    priceConfig: AssetPriceProviderConfig;
  }>,
  baselineNav: BN,
): Promise<{
  liveNav: BN;
  assetPrices: (AssetPrice | null)[];
}> {
  const priceConfigs = basktAssets.map((asset) => asset.priceConfig);
  const assetPrices = await fetchAssetPrices(priceConfigs, basktAssets.map((asset) => asset.assetId));

  const currentAssetConfigs = basktAssets.map((asset, index) => {
    const price = assetPrices[index];
    const currentPrice = price ? new BN(price.priceUSD) : asset.baselinePrice;
    return {
      assetId: asset.assetId,
      weight: asset.weight,
      direction: asset.direction,
      baselinePrice: currentPrice,
    };
  });

  const liveNav = calculateNav(
    basktAssets.map((asset) => ({
      assetId: new PublicKey(asset.assetId),
      weight: asset.weight,
      direction: Boolean(asset.direction),
      baselinePrice: asset.baselinePrice,
    })),
    currentAssetConfigs.map((asset) => ({
      assetId: new PublicKey(asset.assetId),
      weight: asset.weight,
      direction: Boolean(asset.direction),
      baselinePrice: asset.baselinePrice,
    })),
    baselineNav,
  );

  return {
    liveNav,
    assetPrices,
  };
}
