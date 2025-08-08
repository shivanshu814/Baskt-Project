import { BasktAssetInfo, BasktInfo } from '@baskt/types';
import { SortOption } from '@baskt/ui';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

/**
 * Props for the BasktCard component.
 */
export interface BasktCardProps {
  baskt: any;
  className?: string;
}

/**
 * Raw baskt data.
 */
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
}

/**
 * Metric card type.
 */
export interface MetricCardType {
  label: string;
  value: ReactNode;
  displayValue?: string | number;
  isFormatted?: boolean;
  color?: string;
}

/**
 * Baskt grid props.
 */
export interface BasktGridProps {
  baskts: BasktInfo[];
}

/**
 * Empty state props.
 */
export interface EmptyStateProps {
  onCreateClick: () => void;
}

/**
 * Filter controls props.
 */
export interface FilterControlsProps {
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
}

/**
 * Tab type.
 */
export type TabType = 'all' | 'trending' | 'your';

/**
 * Tab controls props.
 */
export interface TabControlsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

/**
 * Tab content props.
 */
export interface TabContentProps {
  activeTab: TabType;
  filteredBaskts: any[];
  popularBaskts: any[];
  myBaskts: any[];
  userAddress?: string;
}

/**
 * Metric card props.
 */
export interface MetricCardProps {
  card: MetricCardType;
}

/**
 * Baskt card data.
 */
export interface BasktCardData {
  assetCount: number;
  assetImages: BasktAssetInfo[];
  extraAssets: number;
  basktPrice: number;
  performanceData: {
    day?: number;
    week?: number;
    month?: number;
  };
}

/**
 * Baskt card handlers.
 */
export interface BasktCardHandlers {
  handleCardClick: (e: React.MouseEvent) => void;
  handleAccordionToggle: (value: string | undefined) => void;
  handleTradeClick: (e: React.MouseEvent) => void;
  handleExternalLinkClick: (e: React.MouseEvent) => void;
}

/**
 * Asset row props.
 */
export interface AssetRowProps {
  asset: BasktAssetInfo;
  currentWeight?: number;
}

/**
 * Trending banner props.
 */
export interface TrendingBannerProps {
  onReviewClick: () => void;
}

/**
 * Empty state base props.
 */
export interface EmptyStateBaseProps {
  title: string;
  description: string;
  buttonText: string;
  icon: ReactNode;
  onButtonClick: () => void;
}

/**
 * Wallet empty state props.
 */
export interface WalletEmptyStateProps {
  onConnectClick: () => void;
}

/**
 * No baskts created state props.
 */
export interface NoBasktsCreatedStateProps {
  onCreateClick: () => void;
}

/**
 * Empty state icon props.
 */
export interface EmptyStateIconProps {
  icon: LucideIcon;
  className?: string;
}

/**
 * Empty state button props.
 */
export interface EmptyStateButtonProps {
  onClick: () => void;
  text: string;
  icon: LucideIcon;
  className?: string;
}

/**
 * Empty state container props.
 */
export interface EmptyStateContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Empty state content props.
 */
export interface EmptyStateContentProps {
  title: string;
  description: string;
  buttonText: string;
  icon: LucideIcon;
  onButtonClick: () => void;
}

/**
 * Baskt card assets props.
 */
export interface BasktCardAssetsProps {
  baskt: BasktInfo;
  currentWeights: number[];
}

/**
 * Baskt card header props.
 */
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

/**
 * Baskt card metrics props.
 */
export interface BasktCardMetricsProps {
  metricCards: MetricCardType[];
}

/**
 * Baskt card rebalancing props.
 */
export interface BasktCardRebalancingProps {
  baskt: any; // eslint-disable-line
}

export interface BasktInfoExpandedProps {
  baskt: BasktInfo;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
  filteredBaskts: BasktInfo[];
  onBasktSelect: (basktName: string) => void;
  onClose: () => void;
}

export interface BasktListItemProps {
  basktItem: BasktInfo;
  onBasktSelect: (basktName: string) => void;
  onClose: () => void;
}

export interface BasktListProps {
  filteredBaskts: BasktInfo[];
  currentBasktId?: string;
  searchQuery: string;
  onBasktSelect: (basktName: string) => void;
  onClose: () => void;
}

export interface Asset {
  ticker?: string;
  name?: string;
  logo?: string;
}

export interface BasketAssetsDisplayProps {
  assets: Asset[];
}

export interface AssetDisplayConfig {
  maxDisplayCount: number;
  singleAssetSize: string;
  multiAssetSize: string;
  overlapAmount: string;
}
