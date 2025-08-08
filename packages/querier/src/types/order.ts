import { OnchainOrderStatus } from '@baskt/types';
import { QueryResult } from '../models/types';
import { 
  OpenOrderParams, 
  CloseOrderParams, 
  MarketOrderParams, 
  LimitOrderParams 
} from './models/OrderMetadata';

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
  orderType: string;
  timestamp?: string;
  createOrder?: any;
  fullFillOrder?: any;
  position?: string;
  usdcSize: string;
  
  // Action-specific parameters
  openParams?: OpenOrderParams;
  closeParams?: CloseOrderParams;
  
  // Order type-specific parameters  
  marketParams?: MarketOrderParams;
  limitParams?: LimitOrderParams;

  // Backward compatibility fields (derived from params for legacy support)
  size?: string;        // Derived from openParams.notionalValue or closeParams.sizeAsContracts
  collateral?: string;  // Derived from openParams.collateral
  isLong?: boolean;     // Derived from openParams.isLong
  limitPrice?: string;  // Derived from limitParams.limitPrice
  maxSlippage?: string; // Derived from limitParams.maxSlippageBps
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
  status?: OnchainOrderStatus[];
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