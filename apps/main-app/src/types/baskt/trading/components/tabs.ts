import { BasktInfo } from '@baskt/types';

export interface CompositionTabProps {
  baskt: BasktInfo;
}

export interface AssetCompositionData {
  ticker: string;
  logo: string;
  direction: boolean;
  weight: number;
  currentWeight: number;
  baselinePrice: number;
  currentPrice: number;
  change: number;
  changePercentage: number;
}

export interface Asset {
  ticker?: string;
  name?: string;
  logo?: string;
  direction?: boolean;
  weight?: number;
  baselinePrice?: number;
  price?: number;
}

export interface AddCollateralModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: any;
  onAddCollateral: (amount: string) => void;
  usdcBalance: string | number;
}

export interface InfoTabProps {
  baskt: BasktInfo;
}

export interface MetricItemProps {
  label: string;
  value: string | number;
  isLoading?: boolean;
  isPercentage?: boolean;
  showSign?: boolean;
  className?: string;
}
export interface MetricsTabProps {
  baskt: BasktInfo;
}
export interface OpenOrdersTabProps {
  orders: OrderDetails[];
  onCancelOrder: (order: OrderDetails) => void;
}

export interface OrderDetails {
  createdAt: Date;
  orderType: string;
  direction: string;
  size: number;
  collateral: number;
  limitPrice: number;
  orderPDA?: string;
  orderId?: string;
}
export interface PositionHistoryTabProps {
  baskt: BasktInfo;
}

export interface OrderHistoryDetails {
  createdAt: Date;
  orderType: string;
  direction: string;
  size: number;
  collateral: number;
  fees: number;
  transaction: string;
  orderStatus: string;
  orderPDA?: string;
  orderId?: string;
}

export interface ClosePositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: any;
}

export interface PercentageSliderProps {
  percentage: string;
  onSliderChange: (percentage: number) => void;
  onPercentageChange: (value: string) => void;
  positionSize: number;
  isLoading: boolean;
}

export interface PositionsTabProps {
  baskt: BasktInfo;
  positions: any[];
  onAddCollateral: (position: any) => void;
  onClosePosition: (position: any) => void;
}
