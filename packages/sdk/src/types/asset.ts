import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

export type AssetPermissions = {
  allowLongs: boolean;
  allowShorts: boolean;
};

/**
 * Oracle parameters for an asset
 */
export interface OracleParams {
  /** The oracle account address */
  oracleAccount: PublicKey;
  /** The type of oracle used (pyth, switchboard, custom) */
  oracleType: string | { custom: object } | { pyth: object };
  /** Maximum allowed price error */
  maxPriceError: anchor.BN;
  /** Maximum allowed price age in seconds */
  maxPriceAgeSec: number;
  /** Price feed ID for Pyth or Switchboard */
  priceFeedId: string;
}

/**
 * Represents a synthetic asset in the protocol
 */
export interface Asset {
  /** The public key of the asset account */
  address: PublicKey;
  /** The ticker symbol of the asset */
  ticker: string;
  /** Oracle parameters for this asset */
  oracle: OracleParams;
  /** Permissions for the asset */
  permissions: AssetPermissions;
  /** Whether the asset is active */
  isActive: boolean;
}
