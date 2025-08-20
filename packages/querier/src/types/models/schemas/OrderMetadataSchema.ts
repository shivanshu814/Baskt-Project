import mongoose from 'mongoose';
import { OrderAction, OnchainOrderStatus, OrderType } from '@baskt/types';

export const OrderMetadataSchema = new mongoose.Schema(
  {
    owner: {
        type: String,
        required: true,
        trim: true,
    },  
    orderPDA: {
      type: String,
      required: true,
      trim: true,
    },
    orderId: {
      type: Number,
      required: true,
      trim: true,
    },
    baskt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'baskt_metadata',
      required: true,
    },
    basktAddress: {
      type: String,
      required: true,
      trim: true,
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
    positionCreated: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'position_metadata',
        required: false,
    },
    positionAddress: {
      type: String,
      required: false,
      trim: true,
    },
    closeParams: {
      sizeAsContracts: {
        type: String,
        trim: true,
      },
      targetPosition: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'position_metadata',
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
        type: Number,
        trim: true,
      },
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
    cancelOrder: {
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
  },
  {
    timestamps: true,
    collection: 'order_metadata',
  },
);

