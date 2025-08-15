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
  priceHistory: {
    daily?: Array<{ price: string | number; date: string }>;
    weekly?: Array<{ price: string | number; date: string }>;
    monthly?: Array<{ price: string | number; date: string }>;
    yearly?: Array<{ price: string | number; date: string }>;
  } | null;
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
  filteredBaskts: any[];
  popularBaskts: any[];
  myBaskts: any[];
  userAddress?: string;
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
  asset: BasktAssetInfo;
  currentWeight?: number;
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

export interface BasktCardAssetsProps {
  baskt: BasktInfo;
  currentWeights: number[];
}

export interface BasktCardHeaderProps {
  baskt: BasktInfo;
  assetImages: BasktAssetInfo[];
  extraAssets: number;
  assetCount: number;
  basktPrice: number;
  performanceData: {
    day?: number;
    week?: number;
    month?: number;
  };
  safeBasktName: string;
  handlers: BasktCardHandlers;
  setOpen: (value: string | undefined | ((prev: string | undefined) => string | undefined)) => void;
}

export interface BasktCardMetricsProps {
  metricCards: MetricCardType[];
}

export interface BasktCardRebalancingProps {
  baskt: any; // eslint-disable-line
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
