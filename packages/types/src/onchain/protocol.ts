import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

/**
 * Feature flags to enable or disable specific protocol features
 */
export interface OnchainFeatureFlags {
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
  /** Allow adding collateral to positions */
  allowAddCollateral?: boolean;
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
 * Protocol configuration parameters
 */
export interface OnchainProtocolConfig {
  /** Opening fee in basis points */
  openingFeeBps: BN;
  /** Closing fee in basis points */
  closingFeeBps: BN;
  /** Liquidation fee in basis points */
  liquidationFeeBps: BN;
  /** Maximum funding rate in basis points */
  maxFundingRateBps: BN;
  /** Funding interval in seconds */
  fundingIntervalSeconds: BN;
  /** Minimum collateral ratio in basis points */
  minCollateralRatioBps: BN;
  /** Liquidation threshold in basis points */
  liquidationThresholdBps: BN;
  /** Minimum liquidity required */
  minLiquidity: BN;
  /** Last updated timestamp */
  lastUpdated: BN;
  /** Last updated by */
  lastUpdatedBy: string;
  /** Rebalance request fee in lamports */
  rebalanceRequestFeeLamports: BN;
  /** Baskt creation fee in lamports */
  basktCreationFeeLamports: BN;
  /** Treasury cut in basis points */
  treasuryCutBps: BN;
}

/**
 * Access control entry for a specific account
 */
export interface OnchainAccessControlEntry {
  /** The account that has this role */
  account: string;
  /** The role assigned to this account */
  role: string;
}

/**
 * Access control system for the protocol
 */
export interface OnchainAccessControl {
  /** List of accounts with their roles */
  entries: OnchainAccessControlEntry[];
}

/**
 * Protocol account data with standardized types
 */
export interface OnchainProtocolInterface {
  /** Whether the protocol has been initialized */
  isInitialized: boolean;
  /** The owner of the protocol */
  owner: string;
  /** Access control system */
  accessControl: OnchainAccessControl;
  /** Feature flags */
  featureFlags: OnchainFeatureFlags;
  /** Protocol configuration */
  config: OnchainProtocolConfig;
  /** Protocol treasury */
  treasury: PublicKey;
  /** Escrow mint */
  collateralMint: PublicKey;
}

/**
 * Raw protocol account data as returned by the program
 */
export interface OnchainRawProtocolAccount {
  isInitialized: boolean;
  owner: PublicKey;
  accessControl: {
    entries: Array<{
      account: PublicKey;
      role: Record<string, unknown>; // Using unknown instead of {} for better type safety
    }>;
  };
  featureFlags: OnchainFeatureFlags;
  config: OnchainProtocolConfig;
  treasury: PublicKey;
}
