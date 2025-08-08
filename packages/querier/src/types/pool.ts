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
  withdrawQueueHead: number;
  withdrawQueueTail: number;
  pendingLpTokens: string;
  withdrawRateLimitBps: number;
  rateLimitPeriodSecs: number;
  lastRateLimitReset: number;
  withdrawnInWindow: string;
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
  poolId?: string;
  userAddress?: string;
  limit?: number;
  offset?: number;
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
