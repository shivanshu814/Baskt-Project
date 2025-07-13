import { QueryResult } from '../models/types';
import { HistoryItem, OrderAction } from '@baskt/types';

/**
 * History query parameters
 */
export interface HistoryQueryParams {
  basktId?: string;
  userId?: string;
  status?: string;
  action?: OrderAction;
  limit?: number;
  offset?: number;
}

/**
 * History query result
 */
export interface HistoryResult {
  success: boolean;
  data?: HistoryItem[];
  error?: string;
}

/**
 * History filter options
 */
export interface HistoryFilterOptions {
  basktId?: string;
  userId?: string;
  status?: string[];
  action?: OrderAction[];
  dateFrom?: Date;
  dateTo?: Date;
  hasProfit?: boolean;
  hasLoss?: boolean;
  minSize?: number;
  maxSize?: number;
  isLong?: boolean;
}

/**
 * History statistics
 */
export interface HistoryStats {
  totalOrders: number;
  totalPositions: number;
  totalPnl: number;
  averagePnl: number;
  winRate: number;
  totalVolume: number;
  uniqueUsers: number;
  uniqueBaskts: number;
  profitableTransactions: number;
  unprofitableTransactions: number;
}

/**
 * History summary by user
 */
export interface UserHistorySummary {
  userId: string;
  totalOrders: number;
  totalPositions: number;
  totalPnl: number;
  winRate: number;
  totalVolume: number;
  bestTrade: number;
  worstTrade: number;
  activeBaskts: string[];
}

/**
 * History summary by baskt
 */
export interface BasktHistorySummary {
  basktId: string;
  basktName: string;
  totalOrders: number;
  totalPositions: number;
  totalPnl: number;
  totalVolume: number;
  uniqueUsers: number;
  averageTradeSize: number;
  winRate: number;
}

/**
 * History timeline data
 */
export interface HistoryTimeline {
  date: string;
  orders: number;
  positions: number;
  volume: number;
  pnl: number;
  uniqueUsers: number;
} 