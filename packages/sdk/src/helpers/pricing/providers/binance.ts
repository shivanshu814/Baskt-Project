import axios from 'axios';
import { agent, timeout } from './agent';


/**
 * Fetches ticker price data from Binance API
 * @param symbol Trading pair symbol (e.g., 'BTCUSDT')
 * @returns Price data or null on error
 */
export default async function getBinanceData(symbol: string) {
  const url = `https://api.binance.us/api/v3/ticker/price`;
  const options = {
    method: 'GET',
    params: { symbol },
    agent: agent,
    timeout: timeout,
  };

  try {
    const response = await axios.get(url, options);
    if (response.data && response.data.price) {
      return {
        symbol: response.data.symbol,
        price: parseFloat(response.data.price),
      };
    } else {
      console.error('Invalid response from Binance API:', response.data);
      return null;
    }
  } catch (error) {
    console.error('Error fetching data from Binance for symbol', symbol, ':', error);
    return null;
  }
}
