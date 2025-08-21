import { PositionStatus } from '@baskt/types';
import { PositionMetadata } from './models/PositionMetadata';



/**
 * Position data structure combining onchain and metadata
 */
export interface CombinedPosition  extends PositionMetadata {
  usdcSize: string;
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