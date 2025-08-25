export interface Baskt {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface BasktAsset {
  priceRaw: number;
}

export interface BasktAssetConfig {
  assetObjectId: string;
  assetId: string;
  direction: boolean;
  weight: number;
  baselinePrice: string;
  _id?: string;
}

export interface BasktAssetInfo {
  _id: string;
  ticker: string;
  name: string;
  assetAddress: string;
  permissions: {
    allowLongs: boolean;
    allowShorts: boolean;
  };
  allTimeLongVolume: string;
  allTimeShortVolume: string;
  isActive: boolean;
  listingTime: number;
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
  logo: string;
  createdAt: string;
  basktIds: string[];
  updatedAt: string;
  __v: number;
  price: number;
  change24h: number;
  exposure: {
    longOpenInterest: string;
    shortOpenInterest: string;
  };
  volume: {
    longVolume: string;
    shortVolume: string;
  };
  weight: number;
  direction: boolean;
  id: string;
  baselinePrice: string;
  volume24h: number;
  marketCap: number;
}

export interface BasktConfig {
  openingFeeBps: number;
  closingFeeBps: number;
  liquidationFeeBps: number;
  minCollateralRatioBps: number;
  liquidationThresholdBps: number;
}

export interface BasktStats {
  change24h: number;
  change7d: number;
  change30d: number;
  change365d: number;
  longAllTimeVolume: string;
  shortAllTimeVolume: string;
  longOpenInterestContracts: string;
  shortOpenInterestContracts: string;
}

export interface BasktFundingIndex {
  cumulativeIndex: string;
  lastUpdateTimestamp: number;
  currentRate: string;
}

export interface BasktRebalanceFeeIndex {
  cumulativeIndex: string;
  lastUpdateTimestamp: number;
}

export interface BasktPerformance {
  daily: number;
  weekly: number;
  monthly: number;
  year: number;
}

export interface BasktData {
  _id: string;
  uid: number;
  name: string;
  basktId: string;
  creator: string;
  isPublic: boolean;
  status: string;
  openPositions: number;
  stats: BasktStats;
  lastRebalanceTime: number;
  currentAssetConfigs: BasktAssetConfig[];
  baselineNav: string;
  rebalancePeriod: number;
  config: BasktConfig;
  fundingIndex: BasktFundingIndex;
  rebalanceFeeIndex: BasktRebalanceFeeIndex;
  creationTxSignature: string;
  activateBasktTxSignature: string;
  decomissionBasktTxSignature: string;
  closeBasktTxSignature: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  assets: BasktAssetInfo[];
  price: number;
  change24h: number;
  aum: number;
  sparkline: number[];
  performance: BasktPerformance;
}

export interface BasktListProps {
  onActivate: (basktId: string) => Promise<void>;
  activatingBasktId: string | null;
  onViewDetails?: (basktId: string) => void;
}

export interface BasktRowProps {
  baskt: BasktData;
  onActivate: (basktId: string) => Promise<void>;
  isActivating: boolean;
  onViewDetails?: (basktId: string) => void;
}
export interface BasktResponse {
  success: boolean;
  data: BasktData[];
  message?: string;
}

export interface RebalanceHistoryTableProps {
  basktId: string;
}
export interface BasktDetailPageProps {
  baskt: BasktData;
  onBack: () => void;
}
