import mongoose from 'mongoose';
import { OrderAction, OrderStatus } from '../onchain/order';

export interface OrderModel {
  address: string;
  owner: string;
  orderId: string;
  basktId: string;
  userPublicKey: string;
  size: string;
  collateral: string;
  isLong: boolean;
  action: OrderAction;
  status: OrderStatus;
  timestamp: string;
  targetPosition: string | null;
  bump: number;
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const OrderSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
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
      required: true,
      trim: true,
    },
    userPublicKey: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    collateral: {
      type: String,
      required: true,
      trim: true,
    },
    isLong: {
      type: Boolean,
      required: true,
    },
    action: {
      type: Number,
      enum: [OrderAction.Open, OrderAction.Close],
      required: true,
    },
    status: {
      type: String,
      enum: [OrderStatus.PENDING, OrderStatus.FILLED, OrderStatus.CANCELLED],
      required: true,
    },
    timestamp: {
      type: String,
      required: true,
      trim: true,
    },
    targetPosition: {
      type: String,
      trim: true,
      default: null,
    },
    bump: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
