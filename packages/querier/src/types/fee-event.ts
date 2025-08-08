/**
 * Fee event data structure
 */
export interface FeeEventData {
  eventId: string;
  eventType:
    | 'POSITION_OPENED'
    | 'POSITION_CLOSED'
    | 'POSITION_LIQUIDATED'
    | 'LIQUIDITY_ADDED'
    | 'LIQUIDITY_REMOVED'
    | 'POSITION_PARTIALLY_CLOSED';
  transactionSignature: string;
  timestamp: Date;
  basktId?: string;
  owner: string;
  feeToTreasury: string;
  feeToBlp: string;
  totalFee: string;
  // Position-specific fields
  positionId?: string;
  orderId?: string;
  positionSize?: string;
  entryPrice?: string;
  exitPrice?: string;
  isLong?: boolean;
  // Liquidity-specific fields
  liquidityProvider?: string;
  liquidityPool?: string;
  liquidityAmount?: string;
  sharesAmount?: string;
}

/**
 * Fee event filter options
 */
export interface FeeEventFilterOptions {
  eventType?: string;
  owner?: string;
  basktId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Fee event statistics
 */
export interface FeeEventStats {
  totalEvents: number;
  eventTypeStats: {
    _id: string;
    count: number;
    totalFeesToTreasury: number;
    totalFeesToBlp: number;
    totalFees: number;
  }[];
}

/**
 * Fee event query options
 */
export interface FeeEventQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'eventType' | 'owner';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Fee event aggregation result
 */
export interface FeeEventAggregationResult {
  totalFees: string;
  totalFeesToTreasury: string;
  totalFeesToBlp: string;
  eventCount: number;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}
