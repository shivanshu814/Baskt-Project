import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { OrderAction, OrderType } from './order';

//----------------------------------------------------------------------------
// EVENTS - ORGANIZED BY FUNCTIONALITY
//----------------------------------------------------------------------------
// This file organizes all TypeScript event interfaces into logical groups:
//
// 1. ORDER EVENTS - Order creation, cancellation, and management
// 2. POSITION EVENTS - Position opening, closing, liquidation, and management
// 3. BASKT EVENTS - Baskt lifecycle, configuration, and rebalancing
// 4. FUNDING EVENTS - Funding rate and index updates
// 5. LIQUIDITY POOL EVENTS - Liquidity pool operations and withdrawals
// 6. PROTOCOL EVENTS - Protocol-level state changes
//
// Each section contains related event interfaces with consistent naming
// conventions and field structures. Events are ordered by their logical
// flow in the system lifecycle.
//
// Note: These interfaces must stay in sync with the Rust events.rs file
//----------------------------------------------------------------------------

//----------------------------------------------------------------------------
// ORDER EVENTS
//----------------------------------------------------------------------------

export interface OrderCreatedEvent {
  owner: PublicKey;
  orderId: BN;
  basktId: PublicKey;
  notionalValue: BN;
  collateral: BN;
  isLong: boolean;
  action: OrderAction;
  targetPosition: PublicKey | null;
  limitPrice: BN;
  maxSlippageBps: BN;
  orderType: OrderType;
  leverageBps: BN;
  timestamp: BN;
}

export interface OrderCancelledEvent {
  owner: PublicKey;
  orderId: BN;
  basktId: PublicKey;
  timestamp: BN;
}

//----------------------------------------------------------------------------
// POSITION EVENTS
//----------------------------------------------------------------------------

export interface PositionOpenedEvent {
  orderId: BN;
  owner: PublicKey;
  positionId: BN;
  basktId: PublicKey;
  size: BN;
  collateral: BN;
  isLong: boolean;
  entryPrice: BN;
  feeToTreasury: BN;
  feeToBlp: BN;
  timestamp: BN;
}

export interface PositionClosedEvent {
  orderId: BN;
  owner: PublicKey;
  positionId: BN;
  basktId: PublicKey;
  sizeClosed: BN;
  sizeRemaining: BN;
  exitPrice: BN;
  timestamp: BN;
  // Settlement details
  collateralRemaining: BN;
  feeToTreasury: BN;
  feeToBlp: BN;
  pnl: BN;
  fundingAccumulated: BN;
  borrowAccumulated: BN;
  escrowToTreasury: BN;
  escrowToPool: BN;
  escrowToUser: BN;
  poolToUser: BN;
  userTotalPayout: BN;
  baseFee: BN;
  rebalanceFee: BN;
  badDebtAmount: BN;
  collateralReleased: BN;
}

export interface PositionLiquidatedEvent {
  owner: PublicKey;
  positionId: BN;
  basktId: PublicKey;
  sizeLiquidated: BN;
  sizeRemaining: BN;
  exitPrice: BN;
  timestamp: BN;
  // Settlement details
  collateralRemaining: BN;
  feeToTreasury: BN;
  feeToBlp: BN;
  pnl: BN;
  fundingAccumulated: BN;
  borrowAccumulated: BN;
  escrowToTreasury: BN;
  escrowToPool: BN;
  escrowToUser: BN;
  poolToUser: BN;
  userTotalPayout: BN;
  baseFee: BN;
  rebalanceFee: BN;
  badDebtAmount: BN;
  collateralReleased: BN;
}

export interface PositionForceClosed {
  baskt: PublicKey;
  position: PublicKey;
  owner: PublicKey;
  closePrice: BN;
  sizeClosed: BN;
  sizeRemaining: BN;
  timestamp: BN;
  // Settlement details
  collateralRemaining: BN;
  feeToTreasury: BN;
  feeToBlp: BN;
  pnl: BN;
  fundingAccumulated: BN;
  borrowAccumulated: BN;
  escrowToTreasury: BN;
  escrowToPool: BN;
  escrowToUser: BN;
  poolToUser: BN;
  userTotalPayout: BN;
  baseFee: BN;
  rebalanceFee: BN;
  badDebtAmount: BN;
  collateralReleased: BN;
}

export interface CollateralAddedEvent {
  owner: PublicKey;
  positionId: BN;
  basktId: PublicKey;
  additionalCollateral: BN;
  newTotalCollateral: BN;
  timestamp: BN;
}

//----------------------------------------------------------------------------
// BASKT EVENTS
//----------------------------------------------------------------------------

export interface BasktCreatedEvent {
  basktCreationFee: BN;
  uid: BN;
  basktId: PublicKey;
  creator: PublicKey;
  isPublic: boolean;
  assetCount: number;
  timestamp: BN;
  basktRebalancePeriod: BN;
}

export interface BasktActivatedEvent {
  basktId: PublicKey;
  timestamp: BN;
}

export interface BasktRebalancedEvent {
  basktId: PublicKey;
  rebalanceIndex: BN;
  newNav: BN;
  timestamp: BN;
}

export interface BasktDecommissioningInitiated {
  baskt: PublicKey;
  initiatedAt: BN;
}

export interface BasktClosed {
  baskt: PublicKey;
  closedAt: BN;
}

export interface BasktConfigUpdatedEvent {
  baskt: PublicKey;
  updatedBy: PublicKey;
  timestamp: BN;
}

export interface RebalanceRequestEvent {
  rebalanceRequestFee: BN;
  basktId: PublicKey;
  creator: PublicKey;
  timestamp: BN;
}

//----------------------------------------------------------------------------
// FUNDING EVENTS
//----------------------------------------------------------------------------

export interface FundingIndexUpdatedEvent {
  basktId: PublicKey;
  cumulativeIndex: BN;
  currentRate: BN;
  timestamp: BN;
}

//----------------------------------------------------------------------------
// LIQUIDITY POOL EVENTS
//----------------------------------------------------------------------------

export interface LiquidityPoolInitializedEvent {
  liquidityPool: PublicKey;
  lpMint: PublicKey;
  usdcVault: PublicKey;
  depositFeeBps: number;
  withdrawalFeeBps: number;
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

export interface WithdrawalQueuedEvent {
  provider: PublicKey;
  requestId: BN;
  lpTokensBurned: BN;
  withdrawalAmount: BN;
  queuePosition: BN;
  timestamp: BN;
}

export interface WithdrawQueueProcessedEvent {
  provider: PublicKey;
  lpTokensBurned: BN;
  amountPaidToUser: BN;
  feesCollected: BN;
  queueTailUpdated: BN;
}

//----------------------------------------------------------------------------
// PROTOCOL EVENTS
//----------------------------------------------------------------------------

export interface ProtocolStateUpdatedEvent {
  protocol: PublicKey;
  updatedBy: PublicKey;
  timestamp: BN;
}

