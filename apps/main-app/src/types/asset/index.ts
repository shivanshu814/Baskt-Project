/**
 * Asset interface for the asset data.
 */
export interface Asset {
  _id?: string;
  ticker: string;
  name: string;
  assetAddress: string;
  logo: string;
  price: number;
  priceRaw: number;
  change24h: number;
  account?: {
    address: string;
    ticker: string;
    permissions: {
      allowLongs: boolean;
      allowShorts: boolean;
    };
    isActive: boolean;
    listingTime: string;
  };
  weight: number;
  config?: {
    priceConfig: {
      provider: {
        id: string;
        chain: string;
        name: string;
      };
      twp: {
        seconds: number;
      };
      updateFrequencySeconds: number;
      units: number;
    };
    coingeckoId?: string;
  };
  basktIds: string[];
}

/**
 * Props for the AssetSelectionModal component.
 */
export interface AssetSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssetSelect: (assets: Asset[]) => void;
  selectedAssets?: Asset[];
}

/**
 * Props for the AssetCard component.
 */
export interface AssetCardProps {
  asset: Asset;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

/**
 * Props for the AssetGrid component.
 */
export interface AssetGridProps {
  filteredAssets: Asset[];
  selectedAssetIds: Set<string>;
  isLoading: boolean;
  error: any;
  onAssetToggle: (id: string) => void;
  onRetry: () => void;
}

/**
 * Props for the AssetLogo component.
 */
export interface AssetLogoProps {
  ticker: string;
  logo: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Props for the AssetModalFooter component.
 */
export interface AssetModalFooterProps {
  selectedAssetIds: Set<string>;
  onClear: () => void;
  onDone: () => void;
}

/**
 * Props for the AssetModalHeader component.
 */
export interface AssetModalHeaderProps {
  selectedAssetIds: Set<string>;
  selectedAssetsList: Asset[];
  onSelectAll: () => void;
  onClose: () => void;
  onAssetRemove: (id: string) => void;
  isLoading: boolean;
  filteredAssetsCount: number;
}

/**
 * Props for the AssetSearch component.
 */
export interface AssetSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;
  filteredAssetsCount: number;
}

/**
 * Props for the ErrorState component.
 */
export interface ErrorStateProps {
  error: any;
  onRetry: () => void;
}

/**
 * Props for the SelectedAssetChip component.
 */
export interface SelectedAssetChipProps {
  asset: Asset;
  onRemove: (id: string) => void;
}
