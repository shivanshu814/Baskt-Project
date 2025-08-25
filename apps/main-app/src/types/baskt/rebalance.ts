export interface RebalanceAssetConfig {
  assetId: string;
  weight: number;
  direction: boolean;
  baselinePrice: string;
  _id?: string;
}

export interface RebalanceHistoryItem {
  _id?: string;
  baskt: string;
  basktId: string;
  txSignature: string;
  previousBaselineNav: string;
  previousRebalanceIndex: string;
  previousAssetConfigs: RebalanceAssetConfig[];
  newBaselineNav: string;
  newRebalanceIndex: string;
  newAssetConfigs: RebalanceAssetConfig[];
  navChange: string;
  navChangePercentage: number;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  rebalanceFeePerUnit?: number;
}

export interface RebalanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  basktId: string;
}
