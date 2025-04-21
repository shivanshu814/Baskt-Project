import { PublicKey } from '@solana/web3.js';

export type OnchainAssetPermissions = {
  allowLongs: boolean;
  allowShorts: boolean;
};

/**
 * Represents a synthetic asset in the protocol
 */
export interface OnchainAsset {
  /** The public key of the asset account */
  address: PublicKey;
  /** The ticker symbol of the asset */
  ticker: string;
  /** Permissions for the asset */
  permissions: OnchainAssetPermissions;
  /** Whether the asset is active */
  isActive: boolean;
  /** Listing time of the asset */
  listingTime: Date;
}
