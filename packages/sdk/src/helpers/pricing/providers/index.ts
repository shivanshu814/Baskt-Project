import BN from 'bn.js';
import getOxFunData from './oxfun';
import getDexScreenerData from './dexscreener';
import getBinanceData from './binance';
import getCoinGeckoData from './coingecko';

export async function callCoinGeckoAPI(id: string) {
  const price = await getCoinGeckoData(id);
  if (!price) {
    return null;
  }
  return {
    priceUSD: new BN(price * 1e6),
  };
}


// Function to call oxfun API
async function callOxfunAPI(id: string) {
  const price = await getOxFunData(id);
  const priceUSD = new BN(price * 1e6);
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
    priceUSD: new BN(prices.priceUSD * 1e6),
  };
}

async function callBinanceAPI(id: string) {
  const price = await getBinanceData(id);
  if (!price) {
    return null;
  }
  const priceUSD = new BN(price.price * 1e6);
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
  if (!priceProvider || !id) {
    console.log(`Invalid price config: provider=${priceProvider}, id=${id}`);
    return null;
  }

  if (priceProvider.toLowerCase() === 'oxfun') {
    return await callOxfunAPI(id);
  } else if (priceProvider.toLowerCase() === 'binance') {
    return await callBinanceAPI(id);
  } else if (priceProvider.toLowerCase() === 'coingecko') {
    return await callCoinGeckoAPI(id);
  } else if (priceProvider.toLowerCase() === 'dexscreener') {
    return await callDexscreenerAPI(id, chain);
  }
  else if (priceProvider.toLowerCase() === 'usdc') {
    return {
      priceUSD: new BN(1e6),
    };
  } else {
    console.log(`Falling back to Dexscreener for provider: ${priceProvider} ${id} ${chain}`);
    return await callDexscreenerAPI(id, chain);
  }
}
