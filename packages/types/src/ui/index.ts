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
  currentWeight?: number; // Real-time weight based on price changes from API
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

export interface BasktMetadataModel {}

export interface BasktInfo {
  basktId: string;
  name: string;
  creator: string;
  creationDate: Date;
  txSignature: string;
  createdAt?: Date;
  updatedAt?: Date;
  assets: BasktAssetInfo[];
  aum: number;
  change24h: number;
  price: number;
  totalAssets: number;
  isActive: boolean;
  isPublic: boolean;
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
  metrics?: {
    currentNav?: number;
    openInterest?: number;
    totalVolume?: number;
    performance?: {
      daily?: number;
      monthly?: number;
      weekly?: number;
      year?: number;
    };
  };
}

export * from './history';
