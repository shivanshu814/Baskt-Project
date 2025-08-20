import { QueryResult } from '../models/types';
import { LiquidityPoolMetadata } from './models/LiquidityPool';

/**
 * Liquidity Pool Data Structure
 */
export interface LiquidityPool extends LiquidityPoolMetadata {
  tokenVault: string;
  minDeposit: string;
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
