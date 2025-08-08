import { z } from 'zod';
import { OrderAction, OrderType } from '@baskt/types';

/*
  Zod schemas corresponding to message interfaces defined in messages.ts.
  These runtime schemas enable validation of payloads before they are put
  on the bus. They purposefully mirror the TypeScript interfaces but do not
  aim to capture numeric range constraints – these can be added later if needed.
  
  Updated to match blockchain events exactly as defined in events.rs
*/

export const OrderRequestSchema = z.object({
  orderId: z.string(),
  owner: z.string(),              // was: user
  basktId: z.string(),            // was: basketId
  size: z.string(),
  collateral: z.string(),
  isLong: z.boolean(),
  action: z.nativeEnum(OrderAction),
  targetPosition: z.string().nullable(),
  orderType: z.nativeEnum(OrderType),
  limitPrice: z.string(),
  maxSlippageBps: z.string(),     // was: z.number().optional()
  leverageBps: z.string(),        // was: leverage z.number()
  timestamp: z.string(),          // was: z.number()
  txSignature: z.string()
});

export const OrderAcceptedSchema = z.object({
  orderId: z.string(),
  owner: z.string(),              // was: user
  basktId: z.string(),            // was: basketId
  action: z.nativeEnum(OrderAction),
  size: z.string(),
  fillPrice: z.string(),          // was: quotedPrice
  positionId: z.string().nullable(),
  targetPosition: z.string().nullable(),
  timestamp: z.string(),          // was: z.number()
  txSignature: z.string()
});

export const OrderRejectedSchema = z.object({
  orderId: z.string(),
  owner: z.string(),
  basktId: z.string(),            // baskt_id from OrderCancelledEvent
  reason: z.string(),
  timestamp: z.string()           // was: z.number()
});

export const PositionOpenedSchema = z.object({
  orderId: z.string(),
  positionId: z.string(),
  owner: z.string(),              // was: user
  basktId: z.string(),            // was: basketId
  size: z.string(),
  collateral: z.string(),
  isLong: z.boolean(),
  entryPrice: z.string(),
  entryFundingIndex: z.string(),
  feeToTreasury: z.string(),
  feeToBlp: z.string(),
  timestamp: z.string(),          // was: z.number()
  txSignature: z.string()
});

export const PositionClosedSchema = z.object({
  orderId: z.string(),
  positionId: z.string(),
  owner: z.string(),              // was: user
  basktId: z.string(),            // was: basketId
  size: z.string(),
  exitPrice: z.string(),
  pnl: z.string(),
  feeToTreasury: z.string(),
  feeToBlp: z.string(),
  fundingPayment: z.string(),
  settlementAmount: z.string(),
  poolPayout: z.string(),
  timestamp: z.string(),          // was: z.number()
  txSignature: z.string()
});

export const PositionLiquidatedSchema = z.object({
  positionId: z.string(),
  owner: z.string(),              // was: user
  basktId: z.string(),            // was: basketId
  size: z.string(),
  exitPrice: z.string(),          // was: liquidationPrice
  pnl: z.string(),
  feeToTreasury: z.string(),
  feeToBlp: z.string(),
  fundingPayment: z.string(),
  remainingCollateral: z.string(),
  poolPayout: z.string(),
  timestamp: z.string(),          // was: z.number()
  txSignature: z.string()
});

export const LiquidationSignalSchema = z.object({
  positionId: z.string(),
  positionPda: z.string(),
  size: z.string(),
  urgency: z.number(),
  estimatedSlippage: z.number(),
  timestamp: z.number()
});

export const FundingUpdateSchema = z.object({
  basktId: z.string(),            // was: basketId
  cumulativeIndex: z.string(),    // was: rate
  currentRate: z.string(),
  timestamp: z.string()           // was: effectiveTime and nextUpdate
});

export const PriceUpdateSchema = z.object({
  asset: z.string(),
  price: z.string(),
  confidence: z.number(),
  sources: z.number(),
  timestamp: z.number()
});

export const BasketNavSchema = z.object({
  basktId: z.string(),            // was: basketId
  nav: z.string(),
  timestamp: z.string()           // was: z.number()
});

export const SnapshotCommitSchema = z.object({
  slot: z.number(),
  timestamp: z.number(),
  positionCount: z.number(),
  basketCount: z.number()
});

export const ServiceHeartbeatSchema = z.object({
  service: z.string(),
  timestamp: z.number(),
  lastUpdate: z.number().optional(),
  health: z.string().optional(),
  stats: z.record(z.any()).optional()
});

export const TradingHaltSchema = z.object({
  reason: z.string(),
  timestamp: z.number(),
  estimatedDuration: z.number(),
  basketIds: z.array(z.string()).optional()
});

export const TransactionSubmittedSchema = z.object({
  txId: z.string(),               // was: id
  signature: z.string(),
  type: z.string(),
  metadata: z.any(),
  timestamp: z.string()           // was: z.number()
});

export const TransactionConfirmedSchema = z.object({
  txId: z.string(),
  signature: z.string(),
  slot: z.number(),
  type: z.string(),
  metadata: z.any(),
  timestamp: z.string()           // was: z.number()
});

export const TransactionFailedSchema = z.object({
  txId: z.string(),
  signature: z.string(),
  error: z.string(),
  type: z.string(),
  metadata: z.any(),
  timestamp: z.string()           // was: z.number()
});

// Convenience aggregate export. Consumers can pick individual schemas or the map
export const MessageSchemas = {
  OrderRequestSchema,
  OrderAcceptedSchema,
  OrderRejectedSchema,
  PositionOpenedSchema,
  PositionClosedSchema,
  PositionLiquidatedSchema,
  LiquidationSignalSchema,
  FundingUpdateSchema,
  PriceUpdateSchema,
  BasketNavSchema,
  SnapshotCommitSchema,
  ServiceHeartbeatSchema,
  TradingHaltSchema,
  TransactionSubmittedSchema,
  TransactionConfirmedSchema,
  TransactionFailedSchema
} as const;

export type MessageSchemaKeys = keyof typeof MessageSchemas;
