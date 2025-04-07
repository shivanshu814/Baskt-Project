import { PublicKey } from '@solana/web3.js';

/**
 * Feature flags to enable or disable specific protocol features
 */
export interface FeatureFlags {
  /** Allow adding liquidity to the protocol */
  allowAddLiquidity: boolean;
  /** Allow removing liquidity from the protocol */
  allowRemoveLiquidity: boolean;
  /** Allow opening new positions */
  allowOpenPosition: boolean;
  /** Allow closing existing positions */
  allowClosePosition: boolean;
  /** Allow withdrawal of PnL */
  allowPnlWithdrawal: boolean;
  /** Allow withdrawal of collateral */
  allowCollateralWithdrawal: boolean;
  /** Allow creation of new baskts */
  allowBasktCreation: boolean;
  /** Allow updating existing baskts */
  allowBasktUpdate: boolean;
  /** Allow trading on the protocol */
  allowTrading: boolean;
  /** Allow liquidations to occur */
  allowLiquidations: boolean;
}

/**
 * Roles that can be assigned to accounts for access control
 */
export enum Role {
  /** Owner role with full permissions */
  Owner = 'owner',
  /** Asset manager role with permission to add and manage assets */
  AssetManager = 'assetManager',
  /** Oracle manager role with permission to update oracle data */
  OracleManager = 'oracleManager',
  /** Rebalancer role with permission to rebalance baskts */
  Rebalancer = 'rebalancer',
}

/**
 * Access control entry for a specific account
 */
export interface AccessControlEntry {
  /** The account that has this role */
  account: string;
  /** The role assigned to this account */
  role: string;
}

/**
 * Access control system for the protocol
 */
export interface AccessControl {
  /** List of accounts with their roles */
  entries: AccessControlEntry[];
}

/**
 * Protocol account data with standardized types
 */
export interface ProtocolInterface {
  /** Whether the protocol has been initialized */
  isInitialized: boolean;
  /** The owner of the protocol */
  owner: string;
  /** Access control system */
  accessControl: AccessControl;
  /** Feature flags */
  featureFlags: FeatureFlags;
}

/**
 * Raw protocol account data as returned by the program
 */
export interface RawProtocolAccount {
  isInitialized: boolean;
  owner: PublicKey;
  accessControl: {
    entries: Array<{
      account: PublicKey;
      role: Record<string, unknown>; // Using unknown instead of {} for better type safety
    }>;
  };
  featureFlags: FeatureFlags;
}
