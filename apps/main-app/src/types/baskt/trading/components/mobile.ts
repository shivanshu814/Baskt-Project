import { BasktInfo } from '@baskt/types';

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
