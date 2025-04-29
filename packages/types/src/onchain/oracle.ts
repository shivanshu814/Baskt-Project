import * as anchor from '@coral-xyz/anchor';

/**
 * Oracle parameters for an asset
 */
export interface OnchainOracleParams {
  /** Price of the asset */
  price: anchor.BN;
  /** Maximum allowed price age in seconds */
  maxPriceAgeSec: number;
}
