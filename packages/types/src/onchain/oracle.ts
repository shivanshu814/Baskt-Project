import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

export interface OnchainCustomOracle {
  address: PublicKey;
  price: anchor.BN;
  expo: number;
  conf: anchor.BN;
  ema: anchor.BN;
  publishTime: anchor.BN;
  status?: 'active' | 'stale' | 'error';
}

/**
 * Oracle parameters for an asset
 */
export interface OnchainOracleParams {
  /** The oracle account address */
  oracleAccount: PublicKey;
  /** Maximum allowed price error */
  maxPriceError: anchor.BN;
  /** Maximum allowed price age in seconds */
  maxPriceAgeSec: number;
}
