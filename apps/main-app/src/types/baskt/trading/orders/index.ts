import { BasktInfo } from '@baskt/types';

export interface Order {
  orderId: string;
  isLong: boolean;
  size: number;
  price: number;
  orderType: {
    market?: {};
    limit?: {
      price: number;
    };
  };
  status: OrderStatus;
  collateral: number;
  createdAt?: Date;
  filledAmount?: number;
  transactionHash?: string;
}

export type OrderStatus = 'pending' | 'filled' | 'cancelled' | 'partial';

export interface TradeFormData {
  selectedPosition: 'long' | 'short';
  size: string;
  sizePercentage: number;
  reduceOnly: boolean;
  tpSl: boolean;
}

export interface TradeCalculation {
  positionSize: number;
  collateral: number;
  liquidationPrice?: number;
  fees: number;
}

export interface TradingTabsProps {
  baskt: BasktInfo;
}

export interface RebalanceTabProps {
  baskt: BasktInfo;
  userAddress?: string;
  isRebalancing: boolean;
  onRebalance: () => void;
}

export interface TradingChartProps {
  baskt: BasktInfo;
}

export interface TradingPageContainerProps {
  isLoading: boolean;
  isBasktDataError: boolean;
  baskt: BasktInfo | null;
}

export interface TradingPanelProps {
  baskt: BasktInfo;
}

export interface Position {
  positionPDA: string;
  isLong: boolean;
  size: number;
  entryPrice: number;
  collateral: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PositionTotals {
  long: number;
  short: number;
}

export interface PositionCalculation {
  positionValue: number;
  entryValue: number;
  pnl: number;
  pnlPercentage: number;
  fees: number;
  liquidationPrice?: number;
  entryPrice: number;
  currentPrice: number;
}
