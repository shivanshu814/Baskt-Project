import mongoose, { ObjectId } from 'mongoose';
import { OrderAction, OnchainOrderStatus, OrderType } from '@baskt/types';
import BN  from 'bn.js';

// Action-specific parameters
export interface OpenOrderParams {
  notionalValue: BN;
  leverageBps: number;
  collateral: BN;
  isLong: boolean;
}

export interface CloseOrderParams {
  sizeAsContracts: BN;
  targetPosition: ObjectId; // Changed to ObjectId to match schema
  targetPositionAddress: string;
}

// Order type-specific parameters
export interface MarketOrderParams {
  // No additional fields for market orders
}

export interface LimitOrderParams {
  limitPrice: number;
  maxSlippageBps: number;
}

export interface OrderMetadata {
  owner: string; // Moved to match schema order
  orderPDA: string;
  orderId: number;
  baskt: mongoose.Types.ObjectId;
  basktAddress: string;
  orderStatus: OnchainOrderStatus;
  orderAction: OrderAction;
  orderType: OrderType;
  
  // Action-specific parameters
  openParams?: OpenOrderParams;
  positionCreated?: mongoose.Types.ObjectId;
  positionAddress?: string;
  closeParams?: CloseOrderParams;
  
  // Order type-specific parameters
  marketParams?: MarketOrderParams;
  limitParams?: LimitOrderParams;
  
  createOrder: {
    tx: string;
    ts: string;
  };
  fullFillOrder?: {
    tx: string;
    ts: string;
  };
  cancelOrder?: {
    tx: string;
    ts: string;
  };
}
