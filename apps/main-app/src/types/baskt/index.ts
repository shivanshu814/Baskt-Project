import { BasktAssetInfo, BasktInfo } from '@baskt/types';
import { SortOption } from '@baskt/ui';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export interface BasktCardProps {
  baskt: any;
  className?: string;
}

export interface RawBasktData {
  basktId?: string;
  account?: any; // eslint-disable-line
  creationDate?: string;
  name?: string;
  image?: string;
  price?: number;
  change24h?: number;
  aum?: number;
  totalAssets?: number;
  sparkline?: number[];
  performance?: {
    daily?: number;
    weekly?: number;
    monthly?: number;
    year?: number;
  };
  assets?: any[]; // eslint-disable-line
  rebalancePeriod?: number; // 0 for manual, seconds for automatic
  txSignature?: string;
  categories?: string[];
  creator?: string;
  isPublic?: boolean;
}

export interface MetricCardType {
  label: string;
  value: ReactNode;
  displayValue?: string | number;
  isFormatted?: boolean;
  color?: string;
}

export interface BasktGridProps {
  baskts: BasktInfo[];
}

export interface EmptyStateProps {
  onCreateClick: () => void;
}

export interface FilterControlsProps {
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
}

export type TabType = 'all' | 'trending' | 'your';

export interface TabControlsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export interface TabContentProps {
  activeTab: TabType;
  publicBaskts: any[];
  yourBaskts: any[];
  filteredBaskts: any[];
  trendingBaskts: any[];
  userAddress?: string;
  isLoading?: boolean;
}

export interface MetricCardProps {
  card: MetricCardType;
}

export interface BasktCardHandlers {
  handleCardClick: (e: React.MouseEvent) => void;
  handleAccordionToggle: (value: string | undefined) => void;
  handleTradeClick: (e: React.MouseEvent) => void;
  handleExternalLinkClick: (e: React.MouseEvent) => void;
}

export interface AssetRowProps {
  assetId: string;
  asset: BasktAssetInfo;
  currentWeight?: number;
}

// Frontend-specific types with custom fields (baselineNav, daily performance, etc.)
export interface FrontendPerformanceInfo {
  daily: number;
  weekly: number;
  monthly: number;
  year?: number;
}

export interface FrontendBasktInfo {
  basktId: string;
  name: string;
  creator?: string;
  creationDate?: Date | string;
  txSignature?: string;
  assets: BasktAssetInfo[];
  totalAssets: number;
  rebalancePeriod: number;
  isPublic: boolean;
  baselineNav: number | string;
  currentNav?: number; // Add current NAV from getBasktNAV
  performance: FrontendPerformanceInfo;
  openPositions?: number;
  lastRebalanceTime?: number;
  status?: string;
}

export interface TrendingBannerProps {
  onReviewClick: () => void;
}

export interface EmptyStateBaseProps {
  title: string;
  description: string;
  buttonText: string;
  icon: ReactNode;
  onButtonClick: () => void;
}

export interface EmptyStateIconProps {
  icon: LucideIcon;
  className?: string;
}

export interface EmptyStateButtonProps {
  onClick: () => void;
  text: string;
  icon: LucideIcon;
  className?: string;
}

export interface EmptyStateContainerProps {
  children: ReactNode;
  className?: string;
}

export interface EmptyStateContentProps {
  title: string;
  description: string;
  buttonText: string;
  icon: LucideIcon;
  onButtonClick: () => void;
}

// Extended asset type to include currentWeight from API
export interface ExtendedAssetInfo extends BasktAssetInfo {
  currentWeight?: number;
}

export interface BasktCardAssetsProps {
  assets: ExtendedAssetInfo[]; // Array of asset objects with currentWeight
}

export interface BasktCardHeaderProps {
  baskt: FrontendBasktInfo;
  assets: any[];
  metrics: any;
  setOpen: (value: string | undefined | ((prev: string | undefined) => string | undefined)) => void;
}

export interface BasktCardMetricsProps {
  metrics: {
    performance: {
      daily: number;
      weekly: number;
      monthly: number;
      year: number;
    };
    openInterest: number;
    currentNav: number;
    baselineNav: string;
  };
}

export interface BasktCardRebalancingProps {
  rebalance: {
    rebalancePeriod: number;
    rebalancingMode: string;
    rebalancingPeriod: string | number;
    lastRebalanceTime: number;
  };
}

export interface Asset {
  ticker?: string;
  name?: string;
  logo?: string;
}

export interface BasketAssetsDisplayProps {
  assets: Asset[];
}

export interface TooltipData {
  x: number;
  y: number;
  value: number;
  time: number;
  show: boolean;
}

export type ChartPeriod = '1D' | '1W' | '1M' | '3M' | '1Y';

export interface TradingDataPoint {
  time: number;
  value: number;
  min?: number;
  max?: number;
  count?: number;
}

export interface TradingDataResponse {
  success: boolean;
  data: TradingDataPoint[];
  dataSource?: string;
  message?: string;
  error?: string;
}

export interface BasktBreakdownItem {
  basktName: string;
  assets: string[];
  totalValuePercentage: number;
}

export interface BasktBreakdownProps {
  tradedBaskts: BasktBreakdownItem[];
  isLoading: boolean;
  error: any;
}
