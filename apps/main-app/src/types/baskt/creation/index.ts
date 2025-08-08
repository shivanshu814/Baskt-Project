import { Asset } from '../../asset';

/**
 * Form data interface for creating a baskt.
 */
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

/**
 * Baskt configuration interface.
 */
export interface BasktConfig {
  id: string;
  name: string;
  visibility: 'public' | 'private';
  rebalancingPeriod: number;
  rebalancingUnit: 'days' | 'weeks' | 'months';
  createdAt: Date;
  updatedAt: Date;
  creatorAddress: string;
  totalValue: number;
  assetCount: number;
}

/**
 * Create baskt step interface.
 */
export interface CreateBasktStep {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
}

/**
 * Asset with position interface.
 */
export interface AssetWithPosition {
  ticker: string;
  position: 'long' | 'short';
  weight: string;
}

/**
 * Props for the Step1BasicInfo component.
 */
export interface Step1BasicInfoProps {
  formData: CreateBasktFormData;
  setFormData: (
    data: CreateBasktFormData | ((prev: CreateBasktFormData) => CreateBasktFormData),
  ) => void;
}

/**
 * Props for the Step2Assets component.
 */
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

/**
 * Props for the Step3Review component.
 */
export interface Step3ReviewProps {
  formData: CreateBasktFormData;
  selectedAssets: Asset[];
  assetDetails: AssetWithPosition[];
}
