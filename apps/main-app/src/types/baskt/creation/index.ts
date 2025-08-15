import { Asset } from '../../asset';

export interface CreateBasktFormData {
  name: string;
  visibility: 'public' | 'private';
  rebalancingType: 'automatic' | 'manual';
  rebalancingPeriod: number;
  rebalancingUnit: 'days' | 'weeks' | 'months';
  description?: string;
  tags?: string[];
  assets: string[];
}

export interface AssetWithPosition {
  ticker: string;
  position: 'long' | 'short';
  weight: string;
}

export interface Step1BasicInfoProps {
  formData: CreateBasktFormData;
  setFormData: (
    data: CreateBasktFormData | ((prev: CreateBasktFormData) => CreateBasktFormData),
  ) => void;
}

export interface Step2AssetsProps {
  formData: CreateBasktFormData;
  setFormData: (
    data: CreateBasktFormData | ((prev: CreateBasktFormData) => CreateBasktFormData),
  ) => void;
  onWeightChange: (totalWeight: number, hasLowWeight: boolean) => void;
  onAssetsChange: (assets: Asset[], details: AssetWithPosition[]) => void;
  selectedAssets?: Asset[];
  assetDetails?: AssetWithPosition[];
}

export interface Step3ReviewProps {
  formData: CreateBasktFormData;
  selectedAssets: Asset[];
  assetDetails: AssetWithPosition[];
}
