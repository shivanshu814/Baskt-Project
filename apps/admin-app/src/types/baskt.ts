export interface Baskt {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface BasktAccount {
  isActive: boolean;
}

export interface BasktAsset {
  priceRaw: number;
}

export interface BasktData {
  basktId: string;
  name: string;
  account: BasktAccount;
  assets: BasktAsset[];
}

export interface BasktListProps {
  onActivate: (basktId: string) => Promise<void>;
  activatingBasktId: string | null;
}

export interface BasktRowProps {
  baskt: BasktData;
  onActivate: (basktId: string) => Promise<void>;
  isActivating: boolean;
}
export interface BasktResponse {
  success: boolean;
  data: BasktData[];
  message?: string;
}
