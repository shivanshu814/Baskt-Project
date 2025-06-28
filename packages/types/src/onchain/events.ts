import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { OrderAction, OrderType } from './order';

//----------------------------------------------------------------------------
// EVENTS
//----------------------------------------------------------------------------

export interface RegistryInitializedEvent {
  registry: PublicKey;
  protocol: PublicKey;
  treasury: PublicKey;
  treasuryToken: PublicKey;
  liquidityPool: PublicKey;
  tokenVault: PublicKey;
  poolAuthority: PublicKey;
  programAuthority: PublicKey;
  escrowMint: PublicKey;
  initializer: PublicKey;
  timestamp: BN;
}

export interface OrderCreatedEvent {
  owner: PublicKey;
  orderId: BN;
  basktId: PublicKey;
  size: BN;
  collateral: BN;
  isLong: boolean;
  action: OrderAction;
  targetPosition: PublicKey | null;
  limitPrice: BN;
  maxSlippageBps: BN;
  orderType: OrderType;
  timestamp: BN;
}

export interface OrderCancelledEvent {
  owner: PublicKey;
  orderId: BN;
  basktId: PublicKey;
  timestamp: BN;
}

export interface OrderFilledEvent {
  owner: PublicKey;
  orderId: BN;
  basktId: PublicKey;
  action: OrderAction;
  size: BN;
  fillPrice: BN;
  positionId: BN | null; // For open orders
  targetPosition: PublicKey | null; // For close orders
  timestamp: BN;
}

export interface PositionOpenedEvent {
  orderId: BN;
  owner: PublicKey;
  positionId: BN;
  basktId: PublicKey;
  size: BN;
  collateral: BN;
  isLong: boolean;
  entryPrice: BN;
  entryFundingIndex: BN;
  feeToTreasury: BN;
  feeToBlp: BN;
  timestamp: BN;
}

export interface PositionClosedEvent {
  orderId: BN;
  owner: PublicKey;
  positionId: BN;
  basktId: PublicKey;
  size: BN;
  exitPrice: BN;
  pnl: BN;
  feeToTreasury: BN;
  feeToBlp: BN;
  fundingPayment: BN;
  settlementAmount: BN;
  poolPayout: BN;
  timestamp: BN;
}

export interface PositionLiquidatedEvent {
  owner: PublicKey;
  positionId: BN;
  basktId: PublicKey;
  size: BN;
  exitPrice: BN;
  pnl: BN;
  feeToTreasury: BN;
  feeToBlp: BN;
  fundingPayment: BN;
  remainingCollateral: BN;
  poolPayout: BN;
  timestamp: BN;
}

export interface CollateralAddedEvent {
  owner: PublicKey;
  positionId: BN;
  basktId: PublicKey;
  additionalCollateral: BN;
  newTotalCollateral: BN;
  timestamp: BN;
}

export interface FundingIndexUpdatedEvent {
  basktId: PublicKey;
  cumulativeIndex: BN;
  currentRate: BN;
  timestamp: BN;
}

export interface FundingIndexInitializedEvent {
  basktId: PublicKey;
  initialIndex: BN;
  timestamp: BN;
}

export interface BasktCreatedEvent {
  basktId: PublicKey;
  basktName: string;
  creator: PublicKey;
  isPublic: boolean;
  assetCount: number;
  timestamp: BN;
}

export interface BasktActivatedEvent {
  basktId: PublicKey;
  baselineNav: BN;
  timestamp: BN;
}

export interface BasktRebalancedEvent {
  basktId: PublicKey;
  rebalanceIndex: BN;
  baselineNav: BN;
  timestamp: BN;
}

// Baskt Decommissioning Events

export interface BasktDecommissioningInitiated {
  baskt: PublicKey;
  initiatedAt: BN;
  gracePeriodEnd: BN;
  openPositions: BN;
}

export interface BasktSettled {
  baskt: PublicKey;
  settlementPrice: BN;
  settlementFundingIndex: BN;
  settledAt: BN;
  remainingPositions: BN;
}

export interface PositionForceClosed {
  baskt: PublicKey;
  position: PublicKey;
  owner: PublicKey;
  settlementPrice: BN;
  closePrice: BN;
  entryPrice: BN;
  size: BN;
  isLong: boolean;
  collateralReturned: BN;
  pnl: BN;
  fundingPayment: BN;
  closedBy: PublicKey;
  // Enhanced fields for better audit trail
  timestamp: BN;
  escrowReturnedToPool: BN;
  poolPayout: BN;
  badDebtAbsorbed: BN;
  basktSettlementTimestamp: BN;
  positionDurationSeconds: BN;
}

export interface BasktClosed {
  baskt: PublicKey;
  finalNav: BN;
  closedAt: BN;
}

// Liquidity Pool Events

export interface LiquidityPoolInitializedEvent {
  liquidityPool: PublicKey;
  lpMint: PublicKey;
  tokenVault: PublicKey;
  depositFeeBps: number;
  withdrawalFeeBps: number;
  minDeposit: BN;
  initializer: PublicKey;
  timestamp: BN;
}

export interface LiquidityAddedEvent {
  provider: PublicKey;
  liquidityPool: PublicKey;
  depositAmount: BN;
  feeAmount: BN;
  sharesMinted: BN;
  timestamp: BN;
}

export interface LiquidityRemovedEvent {
  provider: PublicKey;
  liquidityPool: PublicKey;
  sharesBurned: BN;
  withdrawalAmount: BN;
  feeAmount: BN;
  netAmountReceived: BN;
  timestamp: BN;
}

export interface OpeningFeeUpdatedEvent {
  protocol: PublicKey;
  oldOpeningFeeBps: BN;
  newOpeningFeeBps: BN;
  updatedBy: PublicKey;
  timestamp: BN;
}

export interface ClosingFeeUpdatedEvent {
  protocol: PublicKey;
  oldClosingFeeBps: BN;
  newClosingFeeBps: BN;
  updatedBy: PublicKey;
  timestamp: BN;
}

export interface LiquidationFeeUpdatedEvent {
  protocol: PublicKey;
  oldLiquidationFeeBps: BN;
  newLiquidationFeeBps: BN;
  updatedBy: PublicKey;
  timestamp: BN;
}

export interface MinCollateralRatioUpdatedEvent {
  protocol: PublicKey;
  oldMinCollateralRatioBps: BN;
  newMinCollateralRatioBps: BN;
  updatedBy: PublicKey;
  timestamp: BN;
}

export interface LiquidationThresholdUpdatedEvent {
  protocol: PublicKey;
  oldLiquidationThresholdBps: BN;
  newLiquidationThresholdBps: BN;
  updatedBy: PublicKey;
  timestamp: BN;
}

export interface TreasuryUpdatedEvent {
  protocol: PublicKey;
  oldTreasury: PublicKey;
  newTreasury: PublicKey;
  updatedBy: PublicKey;
  timestamp: BN;
}

export interface MaxPriceAgeUpdatedEvent {
  protocol: PublicKey;
  oldMaxPriceAgeSec: number;
  newMaxPriceAgeSec: number;
  updatedBy: PublicKey;
  timestamp: BN;
}

export interface MaxPriceDeviationUpdatedEvent {
  protocol: PublicKey;
  oldMaxPriceDeviationBps: BN;
  newMaxPriceDeviationBps: BN;
  updatedBy: PublicKey;
  timestamp: BN;
}

export interface LiquidationPriceDeviationUpdatedEvent {
  protocol: PublicKey;
  oldLiquidationPriceDeviationBps: BN;
  newLiquidationPriceDeviationBps: BN;
  updatedBy: PublicKey;
  timestamp: BN;
}

export interface MinLiquidityUpdatedEvent {
  protocol: PublicKey;
  oldMinLiquidity: BN;
  newMinLiquidity: BN;
  updatedBy: PublicKey;
  timestamp: BN;
}

export interface TreasuryCutUpdatedEvent {
  protocol: PublicKey;
  oldTreasuryCutBps: BN;
  newTreasuryCutBps: BN;
  updatedBy: PublicKey;
  timestamp: BN;
}

export interface FundingCutUpdatedEvent {
  protocol: PublicKey;
  oldFundingCutBps: BN;
  newFundingCutBps: BN;
  updatedBy: PublicKey;
  timestamp: BN;
}

export interface DecommissionGracePeriodUpdatedEvent {
  protocol: PublicKey;
  oldGracePeriod: BN;
  newGracePeriod: BN;
  updatedBy: PublicKey;
  timestamp: BN;
}

// Baskt Config Events

export interface BasktOpeningFeeUpdatedEvent {
  baskt: PublicKey;
  oldOpeningFeeBps: BN | null;
  newOpeningFeeBps: BN | null;
  updatedBy: PublicKey;
  timestamp: BN;
}

export interface BasktClosingFeeUpdatedEvent {
  baskt: PublicKey;
  oldClosingFeeBps: BN | null;
  newClosingFeeBps: BN | null;
  updatedBy: PublicKey;
  timestamp: BN;
}

export interface BasktLiquidationFeeUpdatedEvent {
  baskt: PublicKey;
  oldLiquidationFeeBps: BN | null;
  newLiquidationFeeBps: BN | null;
  updatedBy: PublicKey;
  timestamp: BN;
}

export interface BasktMinCollateralRatioUpdatedEvent {
  baskt: PublicKey;
  oldMinCollateralRatioBps: BN | null;
  newMinCollateralRatioBps: BN | null;
  updatedBy: PublicKey;
  timestamp: BN;
}

export interface BasktLiquidationThresholdUpdatedEvent {
  baskt: PublicKey;
  oldLiquidationThresholdBps: BN | null;
  newLiquidationThresholdBps: BN | null;
  updatedBy: PublicKey;
  timestamp: BN;
}

export interface BasktConfigUpdatedEvent {
  baskt: PublicKey;
  oldConfig: any; // TODO: Import BasktConfig type when available
  newConfig: any; // TODO: Import BasktConfig type when available
  updatedBy: PublicKey;
  timestamp: BN;
} 