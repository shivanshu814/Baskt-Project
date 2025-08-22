export interface MobileBasktInfoSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
  combinedBaskts: any[];
  onBasktSelect: (basktName: string) => void;
}

export interface MobilePriceInfoSectionProps {
  combinedBaskts: any[]; // Using the combined baskt data structure
  performanceColor: string;
  performanceText: string;
  oiLoading: boolean;
  totalOpenInterest: number;
  volumeLoading: boolean;
  totalVolume: number;
}
