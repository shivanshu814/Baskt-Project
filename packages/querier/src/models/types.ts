// Shared types for the querier package
export interface QueryOptions {
  withConfig?: boolean;
  limit?: number;
  offset?: number;
}

export interface AssetOptions extends QueryOptions {
  assetId?: string;
  assetAddress?: string;
}

export interface BasktOptions extends QueryOptions {
  basktId?: string;
  basktName?: string;
}

export interface PriceOptions {
  assetId: string;
  startDate?: number;
  endDate?: number;
}

export interface OrderOptions extends QueryOptions {
  basktId?: string;
  userId?: string;
  orderStatus?: string;
  orderAction?: string;
  orderPDA?: string;
}

export interface PositionOptions extends QueryOptions {
  basktId?: string;
  assetId?: string;
  userId?: string;
  isActive?: boolean;
}

export interface CacheOptions {
  ttl?: number;
  key?: string;
}

export interface QueryResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
} 