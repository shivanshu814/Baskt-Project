import { QueryResult } from '../models/types';

/**
 * Combined order data structure from onchain and metadata
 */
export interface CombinedOrder {
  orderId: string;
  orderPDA: string;
  basktId: string;
  owner: string;
  status: string;
  action: string;
  size: string;
  collateral: string;
  isLong: boolean;
  createOrder?: any;
  fullFillOrder?: any;
  position?: string;
  usdcSize: string;
  orderType: string;
  limitPrice: string;
  maxSlippage: string;
}

/**
 * Order status enum
 */
export enum OrderStatus {
  OPEN = 'OPEN',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED'
}

/**
 * Order action enum
 */
export enum OrderAction {
  BUY = 'BUY',
  SELL = 'SELL',
  OPEN = 'OPEN',
  CLOSE = 'CLOSE'
}

/**
 * Order type enum
 */
export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP = 'STOP',
  STOP_LIMIT = 'STOP_LIMIT'
}

/**
 * Order filter options
 */
export interface OrderFilterOptions {
  basktId?: string;
  userId?: string;
  status?: OrderStatus[];
  action?: OrderAction[];
  orderType?: OrderType[];
  dateFrom?: Date;
  dateTo?: Date;
  minSize?: string;
  maxSize?: string;
  minPrice?: string;
  maxPrice?: string;
  isLong?: boolean;
}

/**
 * Order analytics data
 */
export interface OrderAnalytics {
  totalOrders: number;
  filledOrders: number;
  cancelledOrders: number;
  openOrders: number;
  totalVolume: string;
  averageOrderSize: string;
  fillRate: number;
  buyOrders: number;
  sellOrders: number;
  longOrders: number;
  shortOrders: number;
}

/**
 * Order execution statistics
 */
export interface OrderExecutionStats {
  averageFillTime: number;
  medianFillTime: number;
  fastestFillTime: number;
  slowestFillTime: number;
  totalExecutionTime: number;
  partialFills: number;
  slippageStats: {
    average: number;
    median: number;
    maximum: number;
    minimum: number;
  };
}

/**
 * Order book data
 */
export interface OrderBook {
  basktId: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  midPrice: number;
  lastUpdateTime: Date;
}

/**
 * Order book entry
 */
export interface OrderBookEntry {
  price: string;
  size: string;
  orders: number;
  side: 'buy' | 'sell';
} 