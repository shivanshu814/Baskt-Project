import mongoose, { ObjectId } from 'mongoose';

/**
 * Interface for FeeEventMetadata model
 * Stores fee-related events from the Baskt protocol
 */
export interface FeeEventMetadataModel {
  eventId: string; // Unique identifier for the event
  eventType: 'POSITION_OPENED' | 'POSITION_CLOSED' | 'POSITION_LIQUIDATED' | 'LIQUIDITY_ADDED' | 'LIQUIDITY_REMOVED';
  transactionSignature: string;
  timestamp: Date;
  
  // Common fields (optional since LP events may not have these)
  basktId?: string;
  owner: string; // Always present - either position owner or liquidity provider
  
  // Fee breakdown
  feeToTreasury: string; // Stored as string to handle large numbers
  feeToBlp: string; // Stored as string to handle large numbers
  totalFee: string; // Calculated field: feeToTreasury + feeToBlp
  
  // Position-specific fields (optional)
  positionId?: string;
  orderId?: string;
  positionSize?: string;
  entryPrice?: string;
  exitPrice?: string;
  isLong?: boolean;
  
  // Liquidity-specific fields (optional)
  liquidityProvider?: string;
  liquidityPool?: string;
  liquidityAmount?: string;
  sharesAmount?: string;
  
  _id?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Mongoose schema for FeeEventMetadata
 */
export const FeeEventMetadataSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: ['POSITION_OPENED', 'POSITION_CLOSED', 'POSITION_LIQUIDATED', 'LIQUIDITY_ADDED', 'LIQUIDITY_REMOVED'],
    },
    transactionSignature: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    basktId: {
      type: String,
      required: false, // Not required for LP events
    },
    owner: {
      type: String,
      required: true, // Always present - either position owner or liquidity provider
    },
    feeToTreasury: {
      type: String,
      required: true,
    },
    feeToBlp: {
      type: String,
      required: true,
    },
    totalFee: {
      type: String,
      required: true,
    },
    // Position-specific fields
    positionId: {
      type: String,
      required: false,
    },
    orderId: {
      type: String,
      required: false,
    },
    positionSize: {
      type: String,
      required: false,
    },
    entryPrice: {
      type: String,
      required: false,
    },
    exitPrice: {
      type: String,
      required: false,
    },
    isLong: {
      type: Boolean,
      required: false,
    },
    // Liquidity-specific fields
    liquidityProvider: {
      type: String,
      required: false,
    },
    liquidityPool: {
      type: String,
      required: false,
    },
    liquidityAmount: {
      type: String,
      required: false,
    },
    sharesAmount: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
// FeeEventMetadataSchema.index({ eventId: 1 });
// FeeEventMetadataSchema.index({ eventType: 1 });
// FeeEventMetadataSchema.index({ transactionSignature: 1 });
// FeeEventMetadataSchema.index({ timestamp: -1 });
// FeeEventMetadataSchema.index({ basktId: 1 });
// FeeEventMetadataSchema.index({ owner: 1 });
// FeeEventMetadataSchema.index({ eventType: 1, timestamp: -1 });
// FeeEventMetadataSchema.index({ basktId: 1, timestamp: -1 }); 

