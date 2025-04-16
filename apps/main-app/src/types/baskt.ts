export interface Asset {
  id: string;
  name: string;
  ticker: string;
  symbol: string;
  price: number;
  change24h: number;
  position: 'long' | 'short';
  weightage: number;
  allocation?: number;
  volume24h: number;
  marketCap: number;
  logo: string;
}

export interface MarketTrend {
  id: string;
  title: string;
  asset: string;
  change: string;
  volume: string;
  searches: string;
}

export interface CryptoAsset extends Asset {
  sparkline: number[];
}

export interface Baskt {
  id: string;
  name: string;
  description: string;
  totalAssets: number;
  aum: number;
  price: number;
  change24h: number;
  creator: string;
  creationDate: string;
  category: string;
  performance: {
    day: number;
    week: number;
    month: number;
    year: number;
  };
  risk: 'low' | 'medium' | 'high';
  assets: Asset[];
  sparkline: number[];
  priceHistory: {
    daily: ChartData[];
    weekly: ChartData[];
    monthly: ChartData[];
    yearly: ChartData[];
  };
}

export interface UserBasktPosition {
  basktId: string;
  positionSize: number;
  entryPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercentage: number;
  openDate: string;
  type?: 'long' | 'short';
  collateral?: number;
  userBalance: number;
}

export interface TradingPair {
  base: string;
  quote: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface Trade {
  price: number;
  amount: number;
  time: string;
  type: 'buy' | 'sell';
}

export interface ChartData {
  date: string;
  price: number;
  volume: number;
}

export interface TradingViewChartProps {
  className?: string;
  dailyData: ChartData[];
  weeklyData: ChartData[];
  monthlyData: ChartData[];
  yearlyData: ChartData[];
  chartType?: 'line' | 'candle';
  period?: string;
}
