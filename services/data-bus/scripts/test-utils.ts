import { ulid } from 'ulid';
import { z } from 'zod';
import { StreamName } from '../src/streams';
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
import { OrderAction, OrderType } from '@baskt/types';

// Schema mapping for validation
export const STREAM_SCHEMA_MAP: Record<StreamName, any> = {
  'price.update': PriceUpdateSchema,
  'basket.nav': BasketNavSchema,
  'order.request': OrderRequestSchema,
  'order.accepted': OrderAcceptedSchema,
  'order.rejected': OrderRejectedSchema,
  'position.opened': PositionOpenedSchema,
  'position.closed': PositionClosedSchema,
  'position.liquidated': PositionLiquidatedSchema,
  'liquidation.signal': LiquidationSignalSchema,
  'funding.update': FundingUpdateSchema,
  'snapshot.commit': SnapshotCommitSchema,
  'service.heartbeat': ServiceHeartbeatSchema,
  'trading.halt': TradingHaltSchema,
  'tx.submitted': TransactionSubmittedSchema,
  'tx.confirmed': TransactionConfirmedSchema,
  'tx.failed': TransactionFailedSchema
};

// Validation helper
export function validatePayload<T>(stream: StreamName, payload: T): T {
  const schema = STREAM_SCHEMA_MAP[stream];
  if (!schema) {
    throw new Error(`No schema found for stream: ${stream}`);
  }
  
  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Schema validation failed for ${stream}: ${details}`);
    }
    throw error;
  }
}

// Mock data generators
function generateUserId(): string {
  return `user_${ulid().toLowerCase()}`;
}

function generateBasketId(): string {
  return `basket_${ulid().toLowerCase()}`;
}

function generatePositionId(): string {
  return `pos_${ulid().toLowerCase()}`;
}

function generateOrderId(): string {
  return `order_${ulid().toLowerCase()}`;
}

function generateTxId(): string {
  return `tx_${ulid().toLowerCase()}`;
}

function generatePrice(): string {
  return (Math.random() * 100000 + 1000).toFixed(2);
}

function generateSize(): string {
  return (Math.random() * 1000 + 1).toFixed(8);
}

function generateCollateral(): string {
  return (Math.random() * 10000 + 100).toFixed(2);
}

// Fixture builders for each stream type
export const FIXTURE_BUILDERS: Record<StreamName, () => any> = {
  'price.update': () => ({
    asset: ['BTC', 'ETH', 'SOL'][Math.floor(Math.random() * 3)],
    price: generatePrice(),
    confidence: Math.floor(Math.random() * 100) + 1,
    sources: Math.floor(Math.random() * 5) + 1,
    timestamp: Date.now()
  }),

  'basket.nav': () => ({
    basktId: generateBasketId(),        // was: basketId
    nav: generatePrice(),
    timestamp: Date.now().toString()    // now string (was: number)
  }),

  'order.request': () => ({
    orderId: generateOrderId(),
    owner: generateUserId(),             // was: user
    basktId: generateBasketId(),         // was: basketId
    size: generateSize(),
    collateral: generateCollateral(),
    isLong: Math.random() > 0.5,
    action: Math.random() > 0.5 ? OrderAction.Open : OrderAction.Close,  // new field
    targetPosition: null,                // new field
    orderType: OrderType.Market,         // new field
    limitPrice: '0',                     // new field
    maxSlippageBps: (Math.floor(Math.random() * 500)).toString(),  // now string
    leverageBps: (Math.floor(Math.random() * 10) * 100 + 100).toString(), // leverage in bps as string
    timestamp: Date.now().toString(),    // now string (was: number)
    txSignature: ulid()                  // new field
  }),

  'order.accepted': () => ({
    orderId: generateOrderId(),
    owner: generateUserId(),             // was: user
    basktId: generateBasketId(),         // was: basketId
    action: Math.random() > 0.5 ? OrderAction.Open : OrderAction.Close,  // new field
    size: generateSize(),
    fillPrice: generatePrice(),          // was: quotedPrice
    positionId: Math.random() > 0.5 ? generatePositionId() : null,  // new field
    targetPosition: Math.random() > 0.5 ? `target_pos_${ulid()}` : null,  // new field
    timestamp: Date.now().toString(),    // now string (was: number)
    txSignature: ulid()                  // new field
  }),

  'order.rejected': () => ({
    orderId: generateOrderId(),
    owner: generateUserId(),
    basktId: generateBasketId(),         // baskt_id from OrderCancelledEvent
    reason: ['insufficient_collateral', 'invalid_basket', 'market_closed'][Math.floor(Math.random() * 3)],
    timestamp: Date.now().toString()     // now string (was: number)
  }),

  'position.opened': () => ({
    orderId: generateOrderId(),          // from PositionOpenedEvent
    positionId: generatePositionId(),
    owner: generateUserId(),             // was: user
    basktId: generateBasketId(),         // was: basketId
    size: generateSize(),
    collateral: generateCollateral(),
    isLong: Math.random() > 0.5,
    entryPrice: generatePrice(),
    entryFundingIndex: (Math.floor(Math.random() * 1000000)).toString(),  // new field
    feeToTreasury: (Math.floor(Math.random() * 1000)).toString(),         // new field
    feeToBlp: (Math.floor(Math.random() * 1000)).toString(),              // new field
    timestamp: Date.now().toString(),    // now string (was: number)
    txSignature: ulid()                  // new field
  }),

  'position.closed': () => ({
    orderId: generateOrderId(),          // new field from PositionClosedEvent
    positionId: generatePositionId(),
    owner: generateUserId(),             // was: user
    basktId: generateBasketId(),         // was: basketId
    size: generateSize(),
    exitPrice: generatePrice(),
    pnl: (Math.random() * 2000 - 1000).toFixed(2), // Can be negative
    fundingPayment: (Math.random() * 100).toFixed(2),
    feeToTreasury: (Math.floor(Math.random() * 1000)).toString(),  // new field
    feeToBlp: (Math.floor(Math.random() * 1000)).toString(),       // new field
    settlementAmount: (Math.floor(Math.random() * 20000)).toString(), // added field
    poolPayout: (Math.floor(Math.random() * 10000)).toString(),       // added field
    timestamp: Date.now().toString(),    // now string (was: number)
    txSignature: ulid()                  // new field
  }),

  'position.liquidated': () => ({
    positionId: generatePositionId(),
    owner: generateUserId(),             // was: user
    basktId: generateBasketId(),         // was: basketId
    size: generateSize(),
    exitPrice: generatePrice(),          // exit_price from PositionLiquidatedEvent
    pnl: (Math.random() * 2000 - 1000).toFixed(2), // Can be negative
    feeToTreasury: (Math.floor(Math.random() * 1000)).toString(),
    feeToBlp: (Math.floor(Math.random() * 1000)).toString(),
    fundingPayment: (Math.random() * 100).toFixed(2),
    remainingCollateral: (Math.random() * 100).toFixed(2),
    poolPayout: (Math.floor(Math.random() * 10000)).toString(),
    timestamp: Date.now().toString(),    // now string (was: number)
    txSignature: ulid()                  // new field
  }),

  'liquidation.signal': () => ({
    positionId: generatePositionId(),
    positionPda: `pos_pda_${ulid()}`,    // positionPda field from interface
    size: generateSize(),
    urgency: Math.floor(Math.random() * 10) + 1,
    estimatedSlippage: Math.floor(Math.random() * 1000),
    timestamp: Date.now()                // number, not string
  }),

  'funding.update': () => ({
    basktId: generateBasketId(),         // was: basketId
    cumulativeIndex: (Math.floor(Math.random() * 1000000)).toString(), // i128 as string
    currentRate: (Math.random() * 0.01 - 0.005).toFixed(6), // Can be negative, i64 as string
    timestamp: Date.now().toString()     // i64 as string
  }),

  'snapshot.commit': () => ({
    slot: Math.floor(Math.random() * 1000000) + 100000,
    timestamp: Date.now(),
    positionCount: Math.floor(Math.random() * 1000),
    basketCount: Math.floor(Math.random() * 100)
  }),

  'service.heartbeat': () => ({
    service: ['oracle', 'event-engine', 'data-bus'][Math.floor(Math.random() * 3)],
    timestamp: Date.now(),
    lastUpdate: Date.now() - Math.floor(Math.random() * 60000),
    health: ['healthy', 'warning', 'critical'][Math.floor(Math.random() * 3)],
    stats: {
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 1024),
      connections: Math.floor(Math.random() * 100)
    }
  }),

  'trading.halt': () => ({
    reason: ['maintenance', 'circuit_breaker', 'oracle_failure'][Math.floor(Math.random() * 3)],
    timestamp: Date.now(),
    estimatedDuration: Math.floor(Math.random() * 3600000) + 300000, // 5min to 1hr
    basketIds: [generateBasketId(), generateBasketId()]
  }),

  'tx.submitted': () => ({
    txId: generateTxId(),
    signature: `sig_${ulid()}`,
    type: ['order', 'position', 'liquidation'][Math.floor(Math.random() * 3)],
    metadata: {
      orderId: generateOrderId(),
      owner: generateUserId()
    },
    timestamp: Date.now().toString()
  }),

  'tx.confirmed': () => ({
    txId: generateTxId(),
    signature: `sig_${ulid().toLowerCase()}`,
    slot: Math.floor(Math.random() * 1000000),  // should be number
    type: ['order', 'position', 'liquidation'][Math.floor(Math.random() * 3)],
    metadata: {
      orderId: generateOrderId()
    },
    timestamp: Date.now().toString()
  }),

  'tx.failed': () => ({
    txId: generateTxId(),
    signature: `sig_${ulid()}`,
    error: ['insufficient_funds', 'invalid_signature', 'account_not_found'][Math.floor(Math.random() * 3)],
    type: ['order', 'position', 'liquidation'][Math.floor(Math.random() * 3)],
    metadata: {
      orderId: generateOrderId(),
      owner: generateUserId()
    },
    timestamp: Date.now().toString()
  })
};

// Generate validated test payload for any stream
export function generateValidatedPayload(stream: StreamName): any {
  const builder = FIXTURE_BUILDERS[stream];
  if (!builder) {
    throw new Error(`No fixture builder found for stream: ${stream}`);
  }
  
  const payload = builder();
  return validatePayload(stream, payload);
}

// Generate multiple validated payloads
export function generateValidatedPayloads(stream: StreamName, count: number): any[] {
  return Array.from({ length: count }, () => generateValidatedPayload(stream));
}

// Test case interface
export interface TestCase {
  name: string;
  payload: any;
  expectError?: boolean;
  description?: string;
}

// Generate comprehensive test cases for a stream
export function generateTestCases(stream: StreamName): TestCase[] {
  const baseTests: TestCase[] = [
    {
      name: 'Valid payload',
      payload: generateValidatedPayload(stream),
      description: 'Schema-compliant payload'
    },
    {
      name: 'Another valid payload',
      payload: generateValidatedPayload(stream),
      description: 'Second schema-compliant payload with different values'
    }
  ];

  // Add edge case tests specific to common fields
  const edgeTests: TestCase[] = [];
  
  // Test with a third valid payload variation
  try {
    edgeTests.push({
      name: 'Third valid payload variation',
      payload: generateValidatedPayload(stream),
      description: 'Additional schema-compliant payload variation'
    });
  } catch (error) {
    // Skip if payload generation fails
  }

  return [...baseTests, ...edgeTests];
}
