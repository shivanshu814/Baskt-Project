import { PositionStatus } from '@baskt/types';
import { AssetExposure } from './asset';

export interface PortfolioPosition {
  positionId: string;
  positionPDA: string;
  basktId: string;
  basktName: string;
  entryPrice: string;
  exitPrice: string;
  owner: string;
  status: PositionStatus;
  size: string;
  collateral: string;
  isLong: boolean;
  usdcSize: string;
  timestampOpen?: string;
  currentPrice?: number;
  pnl?: number;
  pnlPercentage?: number;
}

export interface PortfolioSummary {
  totalPnL: number;
  totalPnLPercentage: number;
  openPositions: number;
  totalValue: number;
  totalCollateral: number;
  assetExposures: AssetExposure[];
}
