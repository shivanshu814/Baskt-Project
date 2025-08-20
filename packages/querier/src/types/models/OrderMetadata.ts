import mongoose, { ObjectId } from 'mongoose';
import { OrderAction, OnchainOrderStatus, OrderType } from '@baskt/types';

// Action-specific parameters
export interface OpenOrderParams {
  notionalValue: string;
  leverageBps: string;
  collateral: string;
  isLong: boolean;
}

export interface CloseOrderParams {
  sizeAsContracts: string;
  targetPosition: ObjectId; // Changed to ObjectId to match schema
  targetPositionAddress: string;
}

// Order type-specific parameters
export interface MarketOrderParams {
  // No additional fields for market orders
}

export interface LimitOrderParams {
  limitPrice: string;
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