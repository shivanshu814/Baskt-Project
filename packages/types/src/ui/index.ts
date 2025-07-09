import { BasktMetadataModel } from '../models';
import { OnchainBasktAccount } from '../onchain/baskt';

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
  baselinePrice?: number;
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

interface PriceHistoryEntry {
  date: string;
  price: number;
  volume: number;
}

interface PriceHistory {
  daily: PriceHistoryEntry[];
  weekly: PriceHistoryEntry[];
  monthly: PriceHistoryEntry[];
  yearly: PriceHistoryEntry[];
}

export interface BasktInfo extends Omit<BasktMetadataModel, 'assets'> {
  assets: BasktAssetInfo[];
  aum: number;
  change24h: number;
  price: number;
  totalAssets: number;
  isActive: boolean;
  performance: {
    day: number;
    week: number;
    month: number;
    year?: number;
  };
  sparkline: number[];
  priceHistory?: PriceHistory;
  categories: string[];
  description?: string;
  risk?: 'low' | 'medium' | 'high';
  sharpeRatio?: string;
  account: OnchainBasktAccount;
}
