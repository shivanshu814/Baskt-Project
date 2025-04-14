import axios from 'axios';

export default async function getDexScreenerData(pairId: string, chain: string) {
  console.log(pairId, chain);
  const url = `https://api.dexscreener.com/latest/dex/pairs/${chain}/${pairId}`;
  const options = {
    method: 'GET',
  };

  try {
    const response = await axios.get(url, options);
    return {
      priceUSD: response.data.pairs[0].priceUsd,
    };
  } catch (error) {
    console.error('Error fetching data from Dexscreener:', error);
  }
  return null;
}
