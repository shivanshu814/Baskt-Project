import BN from 'bn.js';
import getOxFunData from './oxfun';
import getDexScreenerData from './dexscreener';
import getBinanceData from './binance';

const PRICE_PRECISION = 1e6;

// Function to call oxfun API
async function callOxfunAPI(id: string) {
  const price = await getOxFunData(id);
  const priceUSD = new BN(price * PRICE_PRECISION);
  return {
    priceUSD,
  };
}

// Function to call dexscreener API
async function callDexscreenerAPI(id: string, chain: string) {
  const prices = await getDexScreenerData(id, chain);
  if (!prices) {
    return null;
  }
  return {
    priceUSD: new BN(prices.priceUSD * PRICE_PRECISION),
  };
}

async function callBinanceAPI(id: string) {
  const price = await getBinanceData(id);
  if (!price) {
    return null;
  }
  const priceUSD = new BN(price.price * PRICE_PRECISION);
  return {
    priceUSD,
  };
}

// Function to route the price to the correct API
export async function routePrice(
  priceProvider: string,
  chain: string,
  id: string,
): Promise<{ priceUSD: BN } | null> {
  if (priceProvider === 'oxfun') {
    return await callOxfunAPI(id);
  } else if (priceProvider === 'binance') {
    return await callBinanceAPI(id);
  } else {
    return await callDexscreenerAPI(id, chain);
  }
}
