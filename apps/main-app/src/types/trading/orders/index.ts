import { BasktInfo } from '@baskt/types';
import { BN } from '@coral-xyz/anchor';

export interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export interface OrderInfoCardProps {
  order: any;
}

export interface ModalActionButtonsProps {
  isLoading: boolean;
  onClose: () => void;
  onCancel: () => void;
}

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

export type OrderType = { market: {} } | { limit: { price: number } };

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
export interface PositionsTableProps {
  positions: Position[];
  currentPrice: number;
  onAddCollateral: (position: Position) => void;
  onClosePosition: (position: Position) => void;
}

export interface PriceInfoExpandedProps {
  baskt: BasktInfo;
  oiLoading: boolean;
  totalOpenInterest: number;
  volumeLoading: boolean;
  totalVolume: number;
}

export interface RebalanceTabProps {
  baskt: BasktInfo;
  userAddress?: string;
  isRebalancing: boolean;
  onRebalance: () => void;
}

export interface TradeFormProps {
  formData: TradeFormData;
  setSelectedPosition: (position: 'long' | 'short') => void;
  setSize: (size: string) => void;
  setSizePercentage: (percentage: number) => void;
  setReduceOnly: (reduceOnly: boolean) => void;
  setTpSl: (tpSl: boolean) => void;
  baskt: any;
  usdcBalance: string;
  userUSDCAccount: any;
  positions: any[];
  onTrade: (position: 'long' | 'short') => void;
  priceColor: string;
}

export interface TradeOrdersTabProps {
  baskt: BasktInfo;
  usdcBalance: string;
  positions: any[];
  priceColor: string;
  getLiquidationPrice: (collateral: number, position: 'long' | 'short') => number | null;
  calculateTotalPositions: (positions: any[]) => { long: number; short: number };
}

export interface TradingChartProps {
  baskt: BasktInfo;
}

export interface TradingLayoutProps {
  baskt: BasktInfo;
}

export interface TradingMetricsProps {
  baskt: any;
  totalOpenInterest: number;
  totalVolume: number;
  oiLoading: boolean;
  volumeLoading: boolean;
}

export interface ModalState {
  isAddCollateralModalOpen: boolean;
  setIsAddCollateralModalOpen: (open: boolean) => void;
  isCancelOrderModalOpen: boolean;
  setIsCancelOrderModalOpen: (open: boolean) => void;
  isClosePositionModalOpen: boolean;
  setIsClosePositionModalOpen: (open: boolean) => void;
  selectedPositionForModal: any;
  setSelectedPositionForModal: (position: any) => void;
  selectedOrderForModal: any;
  setSelectedOrderForModal: (order: any) => void;
  openAddCollateralModal: (position: any) => void;
  openClosePositionModal: (position: any) => void;
  openCancelOrderModal: (order: any) => void;
  closeAllModals: () => void;
}

export interface TradingPageContainerProps {
  isLoading: boolean;
  isBasktDataError: boolean;
  baskt: BasktInfo | null;
}

export interface TradingPanelProps {
  baskt: BasktInfo;
}

export interface UseOpenPositionProps {
  baskt: any;
  usdcSize: number;
  navPrice: BN;
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

export type PositionType = 'long' | 'short';
export type CloseType = 'partial' | 'full';
