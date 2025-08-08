import { ZodSchema } from 'zod';
import { STREAMS, StreamName } from './streams';
import {
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
} from '@baskt/shared';

// A mapping between stream identifiers and their corresponding Zod validation schemas.
// This enables runtime validation of payloads prior to publishing onto the DataBus.
export const STREAM_SCHEMA_MAP: Record<StreamName, ZodSchema<any>> = {
  // Price & NAV
  [STREAMS.price.update]: PriceUpdateSchema,
  [STREAMS.price.nav]: BasketNavSchema,

  // Orders
  [STREAMS.order.request]: OrderRequestSchema,
  [STREAMS.order.accepted]: OrderAcceptedSchema,
  [STREAMS.order.rejected]: OrderRejectedSchema,

  // Positions
  [STREAMS.position.opened]: PositionOpenedSchema,
  [STREAMS.position.closed]: PositionClosedSchema,
  [STREAMS.position.liquidated]: PositionLiquidatedSchema,

  // Risk
  [STREAMS.risk.liquidation]: LiquidationSignalSchema,
  [STREAMS.risk.funding]: FundingUpdateSchema,

  // System
  [STREAMS.system.snapshot]: SnapshotCommitSchema,
  [STREAMS.system.heartbeat]: ServiceHeartbeatSchema,
  [STREAMS.system.halt]: TradingHaltSchema,

  // Transactions
  [STREAMS.transaction.submitted]: TransactionSubmittedSchema,
  [STREAMS.transaction.confirmed]: TransactionConfirmedSchema,
  [STREAMS.transaction.failed]: TransactionFailedSchema
};
