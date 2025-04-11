export interface CreateOracleInput {
  oracleName: string;
  oracleType: string;
  price: number;
  exponent: number;
  confidence?: number;
  ema?: number;
}

export interface AddOracleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOracleAdded: () => void;
}
