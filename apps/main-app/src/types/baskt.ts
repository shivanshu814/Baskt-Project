import { BasktFormData } from '../hooks/baskt/create/useCreateBasktForm';
import { AssetInfo, BasktInfo, BasktAssetInfo } from '@baskt/types';
import { SortOption } from '@baskt/ui/types/constants';

export interface UserBasktPositionInfo {
  type?: 'long' | 'short';
  positionSize: number;
  entryPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercentage: number;
  openDate: string;
  collateral?: number;
  userBalance: number;
}

export interface AssetManagementFormProps {
  formData: BasktFormData;
  totalWeightage: number;
  onAddAsset: () => void;
  onRemoveAsset: (ticker: string) => void;
  onAssetPositionChange: (ticker: string, position: 'long' | 'short') => void;
  onAssetWeightChange: (ticker: string, weight: string) => void;
}

export interface AssetSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssetSelect: (asset: AssetInfo) => void;
}

export interface BasicInfoFormProps {
  formData: BasktFormData;
  errors: Record<string, string>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  previewImage: string | null;
  onImageClick: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNameChange: (value: string) => void;
  onRebalancePeriodChange: (value: number, unit: 'day' | 'hour') => void;
  onVisibilityChange: (value: boolean) => void;
}

export interface CreateBasktGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export type TransactionStatus = 'waiting' | 'confirmed' | 'processing' | 'success' | 'failed';

export interface TransactionStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry?: () => void;
  status: TransactionStatus;
  error?: string;
}

export interface BasktChartProps {
  baskt: BasktInfo;
  chartPeriod: string;
  setChartPeriod: (period: string) => void;
  chartType: 'line' | 'candle';
  setChartType: (type: 'line' | 'candle') => void;
  onCompositionClick: () => void;
  onPositionClick: () => void;
}

export interface BasktPositionProps {
  userPosition: UserBasktPositionInfo | null;
}

export interface BasktTradingFormProps {
  baskt: BasktInfo;
  userPosition?: {
    userBalance: number;
  } | null;
  className?: string;
}

export interface IndexCompositionProps {
  assets: BasktAssetInfo[];
}

export type ChartPeriod = '1D' | '1W' | '1M' | '1Y' | 'All';

export interface TooltipData {
  x: number;
  y: number;
  value: number | null;
  time: number;
  show: boolean;
}

export interface BasktCardProps {
  baskt: BasktInfo;
  className?: string;
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
  priceHistory?: {
    daily?: Array<{ price: string | number; date: string }>;
    weekly?: Array<{ price: string | number; date: string }>;
    monthly?: Array<{ price: string | number; date: string }>;
    yearly?: Array<{ price: string | number; date: string }>;
  };
  rebalancePeriod?: { value: number; unit: 'day' | 'hour' };
  txSignature?: string;
  categories?: string[];
  creator?: string;
}
export interface BasktTabsProps {
  baskt: any; // eslint-disable-line
  userPosition: any; // eslint-disable-line
}
export interface UseOpenPositionProps {
  baskt: BasktInfo;
}
export interface CalculateSharesParams {
  collateral: number;
  price: number;
  leverage: number;
}

export interface CalculateLiquidationPriceParams extends CalculateSharesParams {
  position: 'long' | 'short';
}
