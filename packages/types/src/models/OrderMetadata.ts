import mongoose from 'mongoose';
import { OrderAction, OrderStatus, OrderType } from '../onchain/order';
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
  orderStatus: OrderStatus;
  orderAction: OrderAction;
  owner: string;
  position?: string;
  size: string;
  isLong: boolean;
  limitPrice: string;
  maxSlippage: string;
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
      enum: [OrderStatus.PENDING, OrderStatus.FILLED, OrderStatus.CANCELLED],
      required: true,
    },
    orderAction: {
      type: String,
      enum: [OrderAction.Open, OrderAction.Close],
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
    size: {
      type: String,
      required: true,
      trim: true,
    },
    isLong: {
      type: Boolean,
      required: true,
      default: false,
    },
    orderType: {
      type: String,
      enum: [OrderType.Market, OrderType.Limit],
      required: true,
    },
    limitPrice: {
      type: String,
      required: true,
      trim: true,
    },
    maxSlippage: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Add indexes for frequently queried fields
// OrderSchema.index({ basktId: 1, owner: 1 });
// OrderSchema.index({ orderPDA: 1 });
// OrderSchema.index({ orderStatus: 1 });
// OrderSchema.index({ orderAction: 1 });
// OrderSchema.index({ owner: 1 });
// OrderSchema.index({ createdAt: -1 });
