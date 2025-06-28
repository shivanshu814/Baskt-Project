import { PositionStatus } from '@baskt/types';

export interface PositionData {
  positionId: string;
  positionPDA: string;
  basktId: string;
  openOrder: string;
  closeOrder?: string;
  openPosition: {
    tx: string;
    ts: string;
  };
  closePosition?: {
    tx: string;
    ts: string;
  };
  positionStatus: PositionStatus;
  entryPrice: string;
  exitPrice: string;
  owner: string;
  status: PositionStatus;
  size: string;
  collateral: string;
  isLong: boolean;
  usdcSize: string;
  timestampOpen?: string;
}
