import axios from 'axios';

/**
 * Fetches ticker price data from Binance API
 * @param symbol Trading pair symbol (e.g., 'BTCUSDT')
 * @returns Price data or null on error
 */
export default async function getBinanceData(symbol: string) {
  const url = `https://api.binance.com/api/v3/ticker/price`;
  const options = {
    method: 'GET',
    params: { symbol },
  };

  try {
    const response = await axios.get(url, options);
    return {
      symbol: response.data.symbol,
      price: parseFloat(response.data.price),
    };
  } catch (error) {
    console.error('Error fetching data from Binance:', error);
  }
  return null;
}
