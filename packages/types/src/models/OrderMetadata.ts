import mongoose from 'mongoose';
import { OrderAction, OrderStatus } from '../onchain/order';
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
  entryPrice?: string;
  exitPrice?: string;
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
    entryPrice: {
      type: String,
      trim: true,
    },
    exitPrice: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const OrderMetadataModel = mongoose.model<OrderModel>('OrderMetadata', OrderSchema);
