import axios from 'axios';
import { agent, timeout } from './agent';
const API_KEY = process.env.COINGECKO_API || "CG-dJdNszURo45oVKUV3YxiBDwr";

export default async function getCoinGeckoData(coinId: string) {
  const url = `https://pro-api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
  const options = {
    method: 'GET',
    headers: { accept: 'application/json', 'x-cg-pro-api-key': API_KEY },
    agent: agent,
    timeout: timeout,
  };

  try {
    const response = await axios.get(url, options);
    return response.data[coinId].usd;
  } catch (error) {
    console.error('Error fetching data from CoinGecko:', error);
  }
  return null;
}
