import { routePrice } from './providers';
import BN from 'bn.js';
import { AssetPriceProviderConfig, AssetPrice } from '@baskt/types';
import { PublicKey } from '@solana/web3.js';
import { calculateNav } from '@baskt/sdk';

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

