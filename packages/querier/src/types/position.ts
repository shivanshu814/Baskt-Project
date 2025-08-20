import { QueryResult } from '../models/types';
import { PositionMetadata } from './models/PositionMetadata';



/**
 * Position data structure combining onchain and metadata
 */
export interface CombinedPosition  extends PositionMetadata {
  usdcSize: string;
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