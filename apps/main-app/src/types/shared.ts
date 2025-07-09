export interface PublicKeyTextProps {
  publicKey: string;
  className?: string;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface TruncatedTextProps {
  text: string;
  startChars?: number;
  endChars?: number;
  className?: string;
  copyOnClick?: boolean;
}

export interface Asset {
  logo?: string;
  ticker?: string;
  name?: string;
  price?: number;
  direction?: boolean;
  weight?: number;
  currentWeight?: number;
}

export interface Performance {
  day?: number;
  week?: number;
  month?: number;
}

export interface BasktAccount {
  basktId?: string;
}

export interface Baskt {
  name?: string;
  price?: number;
  aum?: number;
  assets?: Asset[];
  rebalancing?: boolean;
  performance?: Performance;
  account: BasktAccount;
}

export interface BasktCardProps {
  baskt: Baskt;
  className?: string;
}
