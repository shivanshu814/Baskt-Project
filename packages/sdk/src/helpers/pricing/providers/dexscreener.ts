import axios from 'axios';
import { agent, timeout } from './agent';


export default async function getDexScreenerData(pairId: string, chain: string) {
  const url = `https://api.dexscreener.com/latest/dex/pairs/${chain}/${pairId}`;
  const options = {
    method: 'GET',
    agent: agent,
    timeout: timeout,
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
