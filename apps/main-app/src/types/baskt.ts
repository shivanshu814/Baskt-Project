export interface Asset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  position: 'long' | 'short';
  weightage: number; // percentage in the Baskt
  allocation?: number; // calculated based on user's position size
  volume24h: number; // 24-hour trading volume
  marketCap: number; // market capitalization
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
  aum: number; // Assets Under Management
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
  positionSize: number; // in USD
  entryPrice: number;
  currentValue: number;
  pnl: number; // profit/loss
  pnlPercentage: number;
  openDate: string;
  type?: 'long' | 'short'; // Added property for position type
  collateral?: number; // Added property for collateral amount
  userBalance: number; // User's available balance in USD
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
}
