export interface AssetInfo {
  id: string;
  name: string;
  ticker: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  assetAddress: string;
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

export interface BasktAssetInfo extends AssetInfo {
  weight: number;
  direction: boolean;
}

export interface BasktInfo {
  id: string;
  name: string;
  description: string;
  price: number;
  change24h: number;
  creator: string;
  creationDate: string;
  //TODO: Change to Tags
  category: string;
  performance: {
    day: number;
    week: number;
    month: number;
    year: number;
  };
  risk: string;
  assets: BasktAssetInfo[];
  priceHistory: {
    daily: ChartData[];
    weekly: ChartData[];
    monthly: ChartData[];
    yearly: ChartData[];
  };
}

export interface UserBasktPositionInfo {
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

export interface ChartData {
  date: string;
  price: number;
  volume: number;
}
