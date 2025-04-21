import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export interface OnchainAssetConfig {
  assetId: PublicKey;
  direction: boolean;
  weight: BN;
  baselinePrice: BN;
}
