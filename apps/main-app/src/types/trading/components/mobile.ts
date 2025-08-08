import { BasktAssetInfo, BasktInfo } from '@baskt/types';

export interface MobileAssetDisplayProps {
  assets: BasktAssetInfo[] | undefined;
}
export interface BasketInfoHeaderMobileProps {
  baskt: BasktInfo;
  onClose?: () => void;
}

export interface MobileHeaderProps {
  baskt: BasktInfo;
}

export interface MobileBasktInfoSectionProps {
  baskt: BasktInfo;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
  filteredBaskts: BasktInfo[];
  onBasktSelect: (basktName: string) => void;
}

export interface MobilePriceInfoSectionProps {
  baskt: BasktInfo;
  performanceColor: string;
  performanceText: string;
  oiLoading: boolean;
  totalOpenInterest: number;
  volumeLoading: boolean;
  totalVolume: number;
}

export interface MobileTradingOverlayProps {
  baskt: BasktInfo;
}

export interface MobileBasketListProps {
  baskt: BasktInfo;
  filteredBaskts: BasktInfo[];
  searchQuery: string;
  onBasktSelect: (basktName: string) => void;
}

export interface MobileBasketDropdownProps {
  baskt: BasktInfo;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
  filteredBaskts: BasktInfo[];
  onBasktSelect: (basktName: string) => void;
}
