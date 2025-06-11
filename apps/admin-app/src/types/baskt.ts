import { OnchainBasktAccount } from '@baskt/types';

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

export interface BasktData {
  basktId: string;
  name: string;
  account: OnchainBasktAccount;
  assets: BasktAsset[];
  price: number;
  change24h: number;
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
export interface FundingIndexTableProps {
  basktId: string;
}
