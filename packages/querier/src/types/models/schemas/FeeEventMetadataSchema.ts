import mongoose from 'mongoose';
import { BNAndDecimal128 } from './helper';

export const FeeEventMetadataSchema = new mongoose.Schema(
    {
      eventType: {
        type: String,
        required: true,
        enum: ['POSITION_OPENED', 'POSITION_CLOSED', 'POSITION_LIQUIDATED', 'LIQUIDITY_ADDED', 'LIQUIDITY_REMOVED', 'BASKT_CREATED', 'REBALANCE_REQUESTED'],
      },
      transactionSignature: {
        type: String,
        required: true,
      },
      payer: {
        type: String,
        required: true, // Always present - either position owner or liquidity provider
      },
      feePaidIn: {
        type: String,
        required: true,
        enum: ['USDC', 'SOL'],
      },
      // Position-specific fields
      positionFee: {
        basktId: {
          type: String,
          required: false,
        },
        positionId: {
          type: String,
          required: false,
        },
        feeToTreasury: BNAndDecimal128(false), 
        feeToBlp: BNAndDecimal128(false),
        totalFee: BNAndDecimal128(false),
        fundingFeePaid: BNAndDecimal128(false),
        fundingFeeOwed: BNAndDecimal128(false),
        rebalanceFeePaid: BNAndDecimal128(false),
      },
      // Liquidity-specific fields
      liquidityFee: {
        feeToTreasury: BNAndDecimal128(false),
        feeToBlp: BNAndDecimal128(false),
        totalFee: BNAndDecimal128(false),
      },
      // Baskt-specific fields
      basktFee: {
        basktId: { type: String, required: false },
        creationFee: BNAndDecimal128(false),
        rebalanceRequestFee: BNAndDecimal128(false),
      },
    },
    {
      timestamps: true,
      collection: 'fee_event_metadata',
    }
  );
  
  