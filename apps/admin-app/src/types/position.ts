import { PublicKey } from '@solana/web3.js';

export interface Position {
  owner: PublicKey;
  positionId: number;
  basktId: PublicKey;
  size: number;
  collateral: number;
  isLong: boolean;
  entryPrice: number;
  exitPrice: number | null;
  entryFundingIndex: number;
  lastFundingIndex: number;
  fundingAccumulated: number;
  status: 'open' | 'closed' | 'liquidated';
  timestampOpen: number;
  timestampClose: number | null;
  bump: number;
  publicKey: PublicKey;
}
