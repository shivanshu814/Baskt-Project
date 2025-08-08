import { BasktInfo } from '@baskt/types';
import { Order } from '../orders';

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

export interface CompositionTableProps {
  assets: Asset[];
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

export interface InfoItemProps {
  label: string;
  value: string | number;
  isPublicKey?: boolean;
  isDate?: boolean;
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
  baskt: BasktInfo;
  orders: any[];
  onCancelOrder: (order: any) => void;
}

export interface OrderDetails {
  orderTime: Date;
  orderType: string;
  orderSize: number;
  orderPrice: number;
  orderCollateral: number;
  limitPrice: number;
  isLong: boolean;
}
export interface OrdersHistoryTabProps {
  baskt: BasktInfo;
  orders: any[];
}

export interface OrderHistoryDetails {
  orderTime: Date;
  orderType: string;
  orderSize: number;
  orderPrice: number;
  filledAmount: number;
  fees: number;
  status: string;
  transactionHash: string;
  isLong: boolean;
}

export interface OrdersTableProps {
  orders: Order[];
  onCancelOrder: (order: Order) => void;
}

export interface ClosePositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: any;
}

export interface PositionInfoCardProps {
  position: any;
  closeAmount: string;
  onAmountChange: (value: string) => void;
  onMaxClick: () => void;
  isLoading: boolean;
}

export interface PercentageSliderProps {
  percentage: string;
  onSliderChange: (percentage: number) => void;
  onPercentageChange: (value: string) => void;
  positionSize: number;
  isLoading: boolean;
}

export interface ErrorDisplayProps {
  error: string | null;
}

export interface ClosePositionActionButtonsProps {
  isLoading: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export interface PositionsTabProps {
  baskt: BasktInfo;
  positions: any[];
  onAddCollateral: (position: any) => void;
  onClosePosition: (position: any) => void;
}

export interface PositionRowProps {
  position: any;
  baskt: BasktInfo;
  onAddCollateral: (position: any) => void;
  onClosePosition: (position: any) => void;
}

export interface PositionCalculations {
  entryPrice: number;
  currentPrice: number;
  positionValue: number;
  entryValue: number;
  pnl: number;
  pnlPercentage: number;
  fees: number;
}
