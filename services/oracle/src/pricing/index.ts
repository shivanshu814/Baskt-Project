import { routePrice } from './providers';
import BN from 'bn.js';
import { AssetPriceProviderConfig, AssetPrice } from '@baskt/types';
import mongoose from 'mongoose';

const cache = new Map<string, AssetPrice>();

export async function fetchTokenPrice(
  name: string,
  chain: string,
  id: string,
): Promise<{
  priceUSD: BN;
} | null> {
  if (cache.has(id)) {
    const cached = cache.get(id);
    return cached ? { priceUSD: new BN(cached.priceUSD) } : null;
  }

  const prices = await routePrice(name, chain, id);
  if (!prices) {
    console.log(prices, 'are null');
    return null;
  }
  return prices;
}

export async function fetchAssetPrices(tokens: AssetPriceProviderConfig[]): Promise<AssetPrice[]> {
  const tokenPrices: AssetPrice[] = [];
  cache.clear();
  for (const token of tokens) {
    let prices;
    const priceProvider = token.provider;
    prices = await fetchTokenPrice(priceProvider.name, priceProvider.chain, priceProvider.id);
    if (!prices) {
      continue;
    }
    const priceUSD = prices.priceUSD;
    const timestamp = new Date().getTime();
    const data: AssetPrice = {
      priceUSD: priceUSD.toString(),
      assetId: token.provider.id,
      timestamp,
    };
    tokenPrices.push(data);
  }
  return tokenPrices;
}
