import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';

export enum OrderAction {
  Open = 'OPEN',
  Close = 'CLOSE',
}

export enum OnchainOrderStatus {
  PENDING = 'PENDING',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
}

export enum OrderType {
  Market = 'MARKET',
  Limit = 'LIMIT',
}

// Open order parameters - required for opening positions
export interface OpenOrderParams {
  notionalValue: BN;    // Position value in USD
  leverageBps: BN;      // Leverage in basis points
  collateral: BN;       // Collateral amount
  isLong: boolean;      // Direction (long/short)
}

// Close order parameters - required for closing positions
export interface CloseOrderParams {
  sizeAsContracts: BN;  // Size to close in contracts
  targetPosition: PublicKey; // Position to close
}

// Market order parameters - no additional fields needed
export interface MarketOrderParams {
  // No additional fields for market orders
}

// Limit order parameters - required for limit orders
export interface LimitOrderParams {
  limitPrice: BN;       // User-specified limit price
  maxSlippageBps: BN;   // Maximum acceptable slippage in basis points
}

export interface OnchainOrder {
  address: PublicKey;
  owner: PublicKey;
  orderId: number;
  basktId: PublicKey;
  userPublicKey: PublicKey;
  
  action: OrderAction;
  orderType: OrderType;
  
  // Action-specific parameters
  openParams?: OpenOrderParams;    // Required for Open action
  closeParams?: CloseOrderParams;  // Required for Close action
  
  // Order type-specific parameters
  marketParams?: MarketOrderParams; // Required for Market orders
  limitParams?: LimitOrderParams;   // Required for Limit orders

  status: OnchainOrderStatus;
  timestamp: BN;
  bump: number;
}
