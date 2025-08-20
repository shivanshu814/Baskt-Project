import { OnchainOrderStatus, OrderAction, OrderType } from '@baskt/types';
import { 
  OrderMetadata
} from './models/OrderMetadata';

/**
 * Combined order data structure from onchain and metadata
 */
export interface CombinedOrder extends OrderMetadata {
  usdcSize: string;
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

