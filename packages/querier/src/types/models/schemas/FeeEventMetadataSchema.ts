import mongoose from 'mongoose';

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
        feeToTreasury: {
          type: String,
          required: false,
        },
        feeToBlp: {
          type: String,
          required: false,
        },
        totalFee: {
          type: String,
          required: false,
        },
        fundingFeePaid: {
          type: String,
          required: false,
        },
        fundingFeeOwed: {
          type: String,
          required: false,
        },
        rebalanceFeePaid: {
          type: String,
          required: false,
        },
      },
      // Liquidity-specific fields
      liquidityFee: {
        feeToTreasury: {
          type: String,
          required: false,
        },
        feeToBlp: {
          type: String,
          required: false,
        },
        totalFee: {
          type: String,
          required: false,
        },
      },
      // Baskt-specific fields
      basktFee: {
        basktId: {
          type: String,
          required: false,
        },
        creationFee: {
          type: String,
          required: false,
        },
        rebalanceRequestFee: {
          type: String,
          required: false,
        },
      },
    },
    {
      timestamps: true,
    }
  );
  
  