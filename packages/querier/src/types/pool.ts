import { QueryResult } from '../models/types';

/**
 * Liquidity Pool Data Structure
 */
export interface LiquidityPool {
  totalLiquidity: string;
  totalShares: string;
  depositFeeBps: number;
  withdrawalFeeBps: number;
  minDeposit: string;
  lastUpdateTimestamp: number;
  lpMint: string;
  tokenVault: string;
  bump: number;
}

/**
 * Pool Deposit Data Structure
 */
export interface PoolDeposit {
  address: string;
  usdcDeposit: number;
  sharePercentage: string;
  lpTokens: number;
}

/**
 * Pool Query Options
 */
export interface PoolQueryOptions {
  includeZeroBalances?: boolean;
  sortBy?: 'amount' | 'percentage' | 'address';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pool Statistics
 */
export interface PoolStats {
  totalDepositors: number;
  averageDeposit: number;
  totalValueLocked: number;
  utilizationRate: number;
} 