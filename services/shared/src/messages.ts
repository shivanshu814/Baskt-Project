import { OrderAction, OrderType } from '@baskt/types';

// Order events - matching blockchain events exactly
export interface OrderRequest {
  orderId: string;           // order_id from OrderCreatedEvent
  owner: string;            // owner from OrderCreatedEvent (was: user)
  basktId: string;          // baskt_id from OrderCreatedEvent (was: basketId)
  size: string;
  collateral: string;
  isLong: boolean;          // is_long from OrderCreatedEvent
  action: OrderAction;      // action from OrderCreatedEvent
  targetPosition: string | null;  // target_position from OrderCreatedEvent
  orderType: OrderType;     // order_type from OrderCreatedEvent
  limitPrice: string;       // limit_price from OrderCreatedEvent
  maxSlippageBps: string;   // max_slippage_bps from OrderCreatedEvent
  leverageBps: string;      // leverage_bps from OrderCreatedEvent
  timestamp: string;        // timestamp from OrderCreatedEvent (i64 as string)
  txSignature: string;      // added by StreamPublisher
}

export interface OrderAccepted {
  orderId: string;          // order_id from OrderFilledEvent
  owner: string;            // owner from OrderFilledEvent (was: user)
  basktId: string;          // baskt_id from OrderFilledEvent
  action: OrderAction;      // action from OrderFilledEvent
  size: string;             // size from OrderFilledEvent
  fillPrice: string;        // fill_price from OrderFilledEvent (was: quotedPrice)
  positionId: string | null; // position_id from OrderFilledEvent (optional for open orders)
  targetPosition: string | null; // target_position from OrderFilledEvent (optional for close orders)
  timestamp: string;        // timestamp from OrderFilledEvent (i64 as string)
  txSignature: string;      // added by StreamPublisher
}

export interface OrderRejected {
  orderId: string;
  owner: string;            // owner from OrderCancelledEvent
  basktId: string;          // baskt_id from OrderCancelledEvent
  reason: string;
  timestamp: string;        // timestamp as string (was: number)
}

export interface PositionOpened {
  orderId: string;          // order_id from PositionOpenedEvent
  positionId: string;       // position_id from PositionOpenedEvent
  owner: string;            // owner from PositionOpenedEvent (was: user)
  basktId: string;          // baskt_id from PositionOpenedEvent (was: basketId)
  size: string;             // size from PositionOpenedEvent
  collateral: string;       // collateral from PositionOpenedEvent
  isLong: boolean;          // is_long from PositionOpenedEvent
  entryPrice: string;       // entry_price from PositionOpenedEvent
  entryFundingIndex: string; // entry_funding_index from PositionOpenedEvent
  feeToTreasury: string;    // fee_to_treasury from PositionOpenedEvent
  feeToBlp: string;         // fee_to_blp from PositionOpenedEvent
  timestamp: string;        // timestamp from PositionOpenedEvent (i64 as string)
  txSignature: string;      // added by StreamPublisher
}

export interface PositionClosed {
  orderId: string;          // order_id from PositionClosedEvent
  positionId: string;       // position_id from PositionClosedEvent
  owner: string;            // owner from PositionClosedEvent (was: user)
  basktId: string;          // baskt_id from PositionClosedEvent (was: basketId)
  size: string;             // size from PositionClosedEvent
  exitPrice: string;        // exit_price from PositionClosedEvent
  pnl: string;              // pnl from PositionClosedEvent (i64 as string)
  feeToTreasury: string;    // fee_to_treasury from PositionClosedEvent
  feeToBlp: string;         // fee_to_blp from PositionClosedEvent
  fundingPayment: string;   // funding_payment from PositionClosedEvent (i128 as string)
  settlementAmount: string; // settlement_amount from PositionClosedEvent
  poolPayout: string;       // pool_payout from PositionClosedEvent
  timestamp: string;        // timestamp from PositionClosedEvent (i64 as string)
  txSignature: string;      // added by StreamPublisher
}

export interface PositionLiquidated {
  positionId: string;       // position_id from PositionLiquidatedEvent
  owner: string;            // owner from PositionLiquidatedEvent (was: user)
  basktId: string;          // baskt_id from PositionLiquidatedEvent (was: basketId)
  size: string;             // size from PositionLiquidatedEvent
  exitPrice: string;        // exit_price from PositionLiquidatedEvent (was: liquidationPrice)
  pnl: string;              // pnl from PositionLiquidatedEvent (i64 as string)
  feeToTreasury: string;    // fee_to_treasury from PositionLiquidatedEvent
  feeToBlp: string;         // fee_to_blp from PositionLiquidatedEvent
  fundingPayment: string;   // funding_payment from PositionLiquidatedEvent (i128 as string)
  remainingCollateral: string; // remaining_collateral from PositionLiquidatedEvent
  poolPayout: string;       // pool_payout from PositionLiquidatedEvent
  timestamp: string;        // timestamp from PositionLiquidatedEvent (i64 as string)
  txSignature: string;      // added by StreamPublisher
}

export interface LiquidationSignal {
  positionId: string;
  positionPda: string;
  size: string;
  urgency: number;
  estimatedSlippage: number;
  timestamp: number;
}

// Funding events - matching blockchain events exactly
export interface FundingUpdate {
  basktId: string;          // baskt_id from FundingIndexUpdatedEvent (was: basketId)
  cumulativeIndex: string;  // cumulative_index from FundingIndexUpdatedEvent (i128 as string)
  currentRate: string;      // current_rate from FundingIndexUpdatedEvent (i64 as string)
  timestamp: string;        // timestamp from FundingIndexUpdatedEvent (i64 as string)
}

export interface PriceUpdate {
  asset: string;
  price: string;
  confidence: number;
  sources: number;
  timestamp: number;
}

// Basket events - these don't have direct blockchain events, keeping consistent naming
export interface BasketNav {
  basktId: string;          // consistent with other interfaces (was: basketId)
  nav: string;
  timestamp: string;        // consistent with other interfaces (was: number)
}

export interface SnapshotCommit {
  slot: number;
  timestamp: number;
  positionCount: number;
  basketCount: number;
}

export interface ServiceHeartbeat {
  service: string;
  timestamp: number;
  lastUpdate?: number;
  health?: string;
  stats?: Record<string, any>;
}

export interface TradingHalt {
  reason: string;
  timestamp: number;
  estimatedDuration: number;
  basketIds?: string[];
}

// Transaction events - StreamPublisher generated
export interface TransactionSubmitted {
  txId: string;             // unique transaction identifier (was: id)
  signature: string;        // transaction signature
  type: string;
  metadata: any;
  timestamp: string;        // consistent with other interfaces (was: number)
}

export interface TransactionConfirmed {
  txId: string;             // unique transaction identifier
  signature: string;
  slot: number;             // Solana slot number
  type: string;
  metadata: any;
  timestamp: string;        // consistent with other interfaces (was: number)
}

export interface TransactionFailed {
  txId: string;             // unique transaction identifier
  signature: string;        // failed transaction signature
  error: string;
  type: string;
  metadata: any;
  timestamp: string;        // consistent with other interfaces (was: number)
}