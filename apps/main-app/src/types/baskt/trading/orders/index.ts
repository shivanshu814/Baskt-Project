import { BasktInfo } from '@baskt/types';

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
  combinedBaskts: any[]; // Using the optimized baskt data structure
}

export interface TradingPageContainerProps {
  isLoading: boolean;
  isBasktDataError: boolean;
  baskt: BasktInfo | null;
}

export interface TradingPanelProps {
  combinedBaskts: any[]; // Using the optimized baskt data structure
}

export interface Position {
  positionPDA: string;
  isLong: boolean;
  size: number;
  entryPrice: number;
  collateral: number;
  createdAt?: Date;
  updatedAt?: Date;
  remainingCollateral: number;
  remainingSize: number;
  positionId: string;
  basktId: string;
  usdcSize: string;
  status: string;
  basktName?: string;
  currentPrice?: number;
  pnl?: number;
  pnlPercentage?: number;
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
