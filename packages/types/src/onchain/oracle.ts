import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

export interface CustomOracle {
  address: PublicKey;
  price: anchor.BN;
  expo: number;
  conf: anchor.BN;
  ema: anchor.BN;
  publishTime: anchor.BN;
  status?: 'active' | 'stale' | 'error';
}

export enum OracleType {
  CUSTOM = 'custom',
  PYTH = 'pyth',
}
