import { Position } from '../baskt/trading/orders';

export type PortfolioTabType = 'positions' | 'baskts' | 'open-orders' | 'order-history';

export type WalletTabType = 'baskts' | 'assets';

export interface PositionsTableProps {
  positions: any[];
}

export interface UserBasktsProps {
  userBaskts: any[];
}

export interface OpenOrdersTableProps {
  openOrders: any[];
}

export interface OrderHistoryTableProps {
  orderHistory: any[];
}

export interface PortfolioTabContentProps {
  activeTab: PortfolioTabType;
  positions: Position[];
  openOrders: any[];
  userBaskts: any[];
}

export interface PortfolioTabControlsProps {
  activeTab: PortfolioTabType;
  onTabChange: (tab: PortfolioTabType) => void;
}

export interface WalletTabContentProps {
  activeTab: WalletTabType;
  tradedBaskts: BasktBreakdownItem[];
  tradedAssets: AssetBreakdownItem[];
}

export interface BasktBreakdownItem {
  basktName: string;
  assets: string[];
  totalValuePercentage: number;
}

export interface AssetBreakdownItem {
  assetId: string;
  assetName: string;
  assetLogo: string;
  assetTicker: string;
  totalValue: string;
  portfolioPercentage: number;
}

export interface WalletTabControlsProps {
  activeTab: WalletTabType;
  onTabChange: (tab: WalletTabType) => void;
}

export interface WalletBreakdownProps {
  basktBreakdown?: BasktBreakdownItem[];
  assetBreakdown?: AssetBreakdownItem[];
}
