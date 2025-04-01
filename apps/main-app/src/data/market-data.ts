export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  sparkline: number[];
}

export const popularCryptos: CryptoAsset[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    price: 51283.42,
    change24h: 2.34,
    volume24h: 23941234567,
    marketCap: 1003287456000,
    sparkline: [47200, 47800, 48100, 48300, 48200, 49100, 50400, 50800, 50900, 51200],
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    price: 2486.73,
    change24h: 3.12,
    volume24h: 18349765432,
    marketCap: 298765432000,
    sparkline: [2300, 2340, 2360, 2380, 2410, 2430, 2450, 2470, 2480, 2490],
  },
  {
    id: 'binancecoin',
    name: 'Binance Coin',
    symbol: 'BNB',
    price: 598.24,
    change24h: -1.23,
    volume24h: 2938475610,
    marketCap: 92847561000,
    sparkline: [610, 608, 605, 601, 600, 598, 597, 596, 597, 598],
  },
  {
    id: 'ripple',
    name: 'Ripple',
    symbol: 'XRP',
    price: 0.5483,
    change24h: 5.67,
    volume24h: 3487659432,
    marketCap: 28475610000,
    sparkline: [0.51, 0.52, 0.525, 0.53, 0.535, 0.54, 0.545, 0.55, 0.548, 0.548],
  },
  {
    id: 'cardano',
    name: 'Cardano',
    symbol: 'ADA',
    price: 0.4235,
    change24h: -0.87,
    volume24h: 1287346509,
    marketCap: 14857324000,
    sparkline: [0.428, 0.427, 0.426, 0.425, 0.424, 0.423, 0.422, 0.423, 0.424, 0.423],
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    price: 148.32,
    change24h: 4.56,
    volume24h: 6735241890,
    marketCap: 62341758000,
    sparkline: [140, 142, 143, 144, 145, 146, 147, 148, 148, 148],
  },
];

export const marketTrends = [
  { id: 'gainer', title: 'Top Gainer', asset: 'SOL', change: '+12.34%' },
  { id: 'volume', title: 'Highest Volume', asset: 'BTC', volume: '$32.8B' },
  { id: 'trending', title: 'Trending', asset: 'DOGE', searches: '+187%' },
];

export const tradingPairs = [
  { base: 'BTC', quote: 'USDT' },
  { base: 'ETH', quote: 'USDT' },
  { base: 'BNB', quote: 'USDT' },
  { base: 'SOL', quote: 'USDT' },
  { base: 'ADA', quote: 'USDT' },
  { base: 'ETH', quote: 'BTC' },
  { base: 'BNB', quote: 'BTC' },
  { base: 'SOL', quote: 'BTC' },
];

export const userPortfolio = {
  totalValue: 12458.34,
  change24h: 3.2,
  assets: [
    { symbol: 'BTC', amount: 0.12, value: 6154.01, allocation: 49.4 },
    { symbol: 'ETH', amount: 1.54, value: 3829.56, allocation: 30.7 },
    { symbol: 'SOL', amount: 12.5, value: 1854.0, allocation: 14.9 },
    { symbol: 'BNB', amount: 1.02, value: 610.2, allocation: 4.9 },
    { symbol: 'ADA', amount: 25, value: 10.57, allocation: 0.1 },
  ],
};
