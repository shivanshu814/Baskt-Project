import { OracleType } from '@baskt/types';

export interface CreateOracleInput {
  oracleName: string;
  oracleType: OracleType;
  oracleAddress: string;
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
  };
}

export interface AddOracleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOracleAdded: () => void;
}
