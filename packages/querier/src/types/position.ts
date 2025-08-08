import { QueryResult } from '../models/types';

/**
 * Partial close history entry
 */
export interface PartialCloseHistory {
  id: string;
  closeAmount: string;
  closePrice: string;
  pnl: string;
  feeCollected: string;
  closePosition: {
    tx: string;
    ts: string;
  };
}

/**
 * Position data structure combining onchain and metadata
 */
export interface CombinedPosition {
  positionId: string;
  positionPDA: string;
  basktId: string;
  openOrder?: string;
  closeOrder?: string;
  openPosition?: {
    tx: string;
    ts: string;
  };
  closePosition?: {
    tx: string;
    ts: string;
  };
  positionStatus: string;
  entryPrice: string;
  exitPrice?: string;
  owner: string;
  status: string;
  size: string;
  remainingSize?: string;
  collateral: string;
  isLong: boolean;
  usdcSize: string;
  fees: number;
  partialCloseHistory?: PartialCloseHistory[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Position status enum
 */
export enum PositionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  LIQUIDATED = 'LIQUIDATED',
  CANCELLED = 'CANCELLED',
}

/**
 * Position filter options
 */
export interface PositionFilterOptions {
  basktId?: string;
  assetId?: string;
  userId?: string;
  isActive?: boolean;
  status?: PositionStatus;
  minSize?: string;
  maxSize?: string;
  minCollateral?: string;
  maxCollateral?: string;
  isLong?: boolean;
}

/**
 * Position analytics data
 */
export interface PositionAnalytics {
  totalPositions: number;
  activePositions: number;
  totalVolume: string;
  totalCollateral: string;
  longPositions: number;
  shortPositions: number;
  averageSize: string;
  averageCollateral: string;
  profitablePositions: number;
  unprofitablePositions: number;
}

/**
 * Position summary for a specific user
 */
export interface UserPositionSummary {
  owner: string;
  totalPositions: number;
  activePositions: number;
  totalVolume: string;
  totalCollateral: string;
  pnl: string;
  winRate: number;
}
