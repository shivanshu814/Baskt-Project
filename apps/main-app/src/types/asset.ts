import { PortfolioPosition } from './portfolio';

export interface AssetExposure {
  assetId: string;
  assetName: string;
  assetTicker: string;
  totalLongExposure: number;
  totalShortExposure: number;
  netExposure: number;
  avgEntryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercentage: number;
  positions: PortfolioPosition[];
}
