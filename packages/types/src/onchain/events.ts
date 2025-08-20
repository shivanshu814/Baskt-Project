import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { OrderAction, OrderType } from './order';

//----------------------------------------------------------------------------
// EVENTS
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
  pnl: BN;
  feeToTreasury: BN;
  feeToBlp: BN;
  fundingPayment: BN;
  settlementAmount: BN;
  poolPayout: BN;
  collateralRemaining: BN;
  timestamp: BN;
}

export interface PositionLiquidatedEvent {
  owner: PublicKey;
  positionId: BN;
  basktId: PublicKey;
  sizeLiquidated: BN;
  sizeRemaining: BN;
  exitPrice: BN;
  pnl: BN;
  feeToTreasury: BN;
  feeToBlp: BN;
  fundingPayment: BN;
  remainingCollateral: BN;
  poolPayout: BN;
  collateralRemaining: BN;
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
  baselineNav: BN;
  timestamp: BN;
}

export interface BasktRebalancedEvent {
  basktId: PublicKey;
  rebalanceIndex: BN;
  baselineNav: BN;
  timestamp: BN;
}

export interface RebalanceRequestEvent {
  rebalanceRequestFee: BN;
  basktId: PublicKey;
  creator: PublicKey;
  timestamp: BN;
}

// Baskt Decommissioning Events

export interface BasktDecommissioningInitiated {
  baskt: PublicKey;
  initiatedAt: BN;
}

export interface PositionForceClosed {
  baskt: PublicKey;
  position: PublicKey;
  owner: PublicKey;
  settlementPrice: BN;
  closePrice: BN;
  entryPrice: BN;
  sizeClosed: BN;
  sizeRemaining: BN;
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
  collateralRemaining: BN;
}

export interface BasktClosed {
  baskt: PublicKey;
  closedAt: BN;
}

// Liquidity Pool Events

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

export interface LiquidityRemovedEvent {
  provider: PublicKey;
  liquidityPool: PublicKey;
  sharesBurned: BN;
  withdrawalAmount: BN;
  feeAmount: BN;
  netAmountReceived: BN;
  timestamp: BN;
}

// Baskt Config Events

export interface BasktConfigUpdatedEvent {
  baskt: PublicKey;
  updatedBy: PublicKey;
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

// Protocol State Events

export interface ProtocolStateUpdatedEvent {
  protocol: PublicKey;
  updatedBy: PublicKey;
  timestamp: BN;
}

