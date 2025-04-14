import { routePrice } from './providers';
import BN from 'bn.js';
import { PriceConfig, AssetPrice } from '@baskt/types';

const cache = new Map<string, AssetPrice>();

export async function fetchTokenPrice(
  name: string,
  chain: string,
  id: string,
): Promise<{
  priceUSD: BN;
} | null> {
  if (cache.has(id)) {
    return cache.get(id);
  }

  const prices = await routePrice(name, chain, id);
  if (!prices) {
    console.log(prices, 'are null');
    return null;
  }
  return prices;
}

export async function fetchAssetPrices(tokens: PriceConfig[]): Promise<AssetPrice[]> {
  const tokenPrices: AssetPrice[] = [];
  cache.clear();
  for (const token of tokens) {
    let prices;
    console.log(token);
    const priceProvider = token.provider;
    prices = await fetchTokenPrice(priceProvider.name, priceProvider.chain, priceProvider.id);
    if (!prices) {
      continue;
    }
    const priceUSD = prices.priceUSD;
    const timestamp = new Date().getTime();
    const data: AssetPrice = {
      priceUSD: priceUSD.toString(),
      assetId: token._id,
      timestamp,
    };
    tokenPrices.push(data);
  }
  return tokenPrices;
}
