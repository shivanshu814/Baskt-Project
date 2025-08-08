import mongoose from 'mongoose';
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
  targetPosition: string;
}

// Order type-specific parameters
export interface MarketOrderParams {
  // No additional fields for market orders
}

export interface LimitOrderParams {
  limitPrice: string;
  maxSlippageBps: string;
}

export interface OrderModel {
  orderPDA: string;
  orderId: string;
  basktId: string;
  createOrder: {
    tx: string;
    ts: string;
  };
  fullFillOrder?: {
    tx: string;
    ts: string;
  };
  orderStatus: OnchainOrderStatus;
  orderAction: OrderAction;
  orderType: OrderType;
  owner: string;
  position?: string;
  timestamp: string;
  
  // Action-specific parameters
  openParams?: OpenOrderParams;
  closeParams?: CloseOrderParams;
  
  // Order type-specific parameters
  marketParams?: MarketOrderParams;
  limitParams?: LimitOrderParams;
}

export const OrderSchema = new mongoose.Schema(
  {
    orderPDA: {
      type: String,
      required: true,
      trim: true,
    },
    orderId: {
      type: String,
      required: true,
      trim: true,
    },
    basktId: {
      type: String,
      ref: 'BasktMetadata',
      required: true,
      trim: true,
    },
    createOrder: {
      tx: {
        type: String,
        required: true,
        trim: true,
      },
      ts: {
        type: String,
        required: true,
        trim: true,
      },
    },
    fullFillOrder: {
      tx: {
        type: String,
        required: false,
        trim: true,
      },
      ts: {
        type: String,
        required: false,
        trim: true,
      },
    },
    orderStatus: {
      type: String,
      enum: [OnchainOrderStatus.PENDING, OnchainOrderStatus.FILLED, OnchainOrderStatus.CANCELLED],
      required: true,
    },
    orderAction: {
      type: String,
      enum: [OrderAction.Open, OrderAction.Close],
      required: true,
    },
    orderType: {
      type: String,
      enum: [OrderType.Market, OrderType.Limit],
      required: true,
    },
    owner: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
      ref: 'PositionMetadata',
    },
    timestamp: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Action-specific parameters
    openParams: {
      notionalValue: {
        type: String,
        trim: true,
      },
      leverageBps: {
        type: String,
        trim: true,
      },
      collateral: {
        type: String,
        trim: true,
      },
      isLong: {
        type: Boolean,
      },
    },
    closeParams: {
      sizeAsContracts: {
        type: String,
        trim: true,
      },
      targetPosition: {
        type: String,
        trim: true,
      },
    },
    
    // Order type-specific parameters
    marketParams: {
      // No additional fields for market orders
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    limitParams: {
      limitPrice: {
        type: String,
        trim: true,
      },
      maxSlippageBps: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

// Add indexes for frequently queried fields
OrderSchema.index({ basktId: 1, owner: 1 });
OrderSchema.index({ orderPDA: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ orderAction: 1 });
OrderSchema.index({ owner: 1 });
OrderSchema.index({ createdAt: -1 });
