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

export interface AssetSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssetSelect: (assets: Asset[]) => void;
  selectedAssets?: Asset[];
}

export interface AssetCardProps {
  asset: Asset;
  isSelected: boolean;
  onToggle: (id: string) => void;
  isLimitReached?: boolean;
}

export interface AssetGridProps {
  filteredAssets: Asset[];
  selectedAssetIds: Set<string>;
  isLoading: boolean;
  error: any;
  onAssetToggle: (id: string) => void;
  onRetry: () => void;
}

export interface AssetLogoProps {
  ticker: string;
  logo: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface AssetModalFooterProps {
  selectedAssetIds: Set<string>;
  onClear: () => void;
  onDone: () => void;
}

export interface AssetModalHeaderProps {
  selectedAssetIds: Set<string>;
  selectedAssetsList: Asset[];
  onSelectAll: () => void;
  onClose: () => void;
  onAssetRemove: (id: string) => void;
  isLoading: boolean;
  filteredAssetsCount: number;
}

export interface AssetSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;
  filteredAssetsCount: number;
}

export interface SelectedAssetChipProps {
  asset: Asset;
  onRemove: (id: string) => void;
}

export interface AssetBreakdownItem {
  assetId: string;
  assetName: string;
  assetLogo: string;
  assetTicker: string;
  totalValue: string;
  portfolioPercentage: number;
}

export interface AssetBreakdownProps {
  uniqueAssets: AssetBreakdownItem[];
}
