import { DataBus, STREAMS, toBN, addBN, mulBN, divBN } from './src/index.js';
import type { OrderRequest, OrderAccepted, PositionOpened, PositionClosed } from '@baskt/shared';
import { OrderAction, OrderType } from '@baskt/types';

// Example usage of the DataBus service
async function example() {
  // Initialize DataBus - supports both single instance and cluster mode
  let dataBus: DataBus;

  if (process.env.REDIS_CLUSTER_NODES) {
    // Cluster mode
    const nodes = process.env.REDIS_CLUSTER_NODES.split(',').map(node => {
      const [host, port] = node.split(':');
      return { host, port: parseInt(port) || 6379 };
    });

    dataBus = new DataBus({
      redisCluster: {
        nodes,
        redisOptions: {
          password: process.env.REDIS_PASSWORD,
          tls: process.env.REDIS_TLS === 'true'
        }
      },
      signingKey: process.env.SIGNING_KEY || 'your-secret-signing-key',
      maxPayloadSize: 2097152, // 2MB
      autoConnect: true
    });
  } else {
    // Single instance mode (auto-connects by default)
    dataBus = new DataBus({
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      signingKey: process.env.SIGNING_KEY || 'your-secret-signing-key',
      maxPayloadSize: 2097152, // 2MB
      autoConnect: true
    });
  }

  // Example 1: Publishing an order request
  // Field names now match blockchain events exactly from OrderCreatedEvent
  // Using BN utilities for precise numeric operations
  const baseSize = '50000';              // 50,000 USDC as string
  const feeBps = '50';                   // 0.5% fee in basis points
  const feeAmount = divBN(mulBN(baseSize, feeBps), '10000'); // Calculate fee
  const totalSize = addBN(baseSize, feeAmount); // Add fee to base size
  
  const orderRequest: OrderRequest = {
    orderId: 'order-123',
    owner: 'user-wallet-address',        // was: user
    basktId: 'basket-1',                 // was: basketId
    size: totalSize,                     // Total size including fees using BN
    collateral: '10000',                 // 10,000 USDC as string
    isLong: true,
    action: OrderAction.Open,            // new field from OrderCreatedEvent
    targetPosition: null,                // new field from OrderCreatedEvent
    orderType: OrderType.Market,         // new field from OrderCreatedEvent
    limitPrice: '0',                     // new field from OrderCreatedEvent
    maxSlippageBps: '100',               // 1% as string (was: number)
    leverageBps: '500',                  // 5x leverage in bps (was: leverage number)
    timestamp: Date.now().toString(),    // i64 as string (was: number)
    txSignature: 'example-tx-signature'  // new field added by StreamPublisher
  };

  const messageId = await dataBus.publish(STREAMS.order.request, orderRequest);
  console.log('Published order request:', messageId);

  // Example 2: Consuming order accepted messages
  console.log('Starting consumer for order accepted messages...');

  // This will run forever, processing messages as they arrive
  await dataBus.consume<OrderAccepted>(
    STREAMS.order.accepted,
    'guardian-service', // Consumer group
    'guardian-1',      // Consumer name
    async (message) => {
      console.log('Received order accepted:', {
        orderId: message.payload.orderId,
        owner: message.payload.owner,                     // was: user
        basktId: message.payload.basktId,                 // was: basketId
        action: message.payload.action,                   // new field from OrderFilledEvent
        size: message.payload.size,                      // from OrderFilledEvent
        fillPrice: message.payload.fillPrice,            // was: quotedPrice
        positionId: message.payload.positionId,          // new field from OrderFilledEvent
        targetPosition: message.payload.targetPosition,  // new field from OrderFilledEvent
        timestamp: message.payload.timestamp,            // now string
        txSignature: message.payload.txSignature         // new field
      });

      // Process the message...
      // The message will be automatically acknowledged after this handler completes
    }
  );

  // Example 3: Consuming position opened messages
  console.log('Starting consumer for position opened messages...');

  await dataBus.consume<PositionOpened>(
    STREAMS.position.opened,
    'position-service',
    'position-1',
    async (message) => {
      console.log('Received position opened:', {
        orderId: message.payload.orderId,               // from PositionOpenedEvent
        positionId: message.payload.positionId,         // from PositionOpenedEvent
        owner: message.payload.owner,                   // was: user
        basktId: message.payload.basktId,               // was: basketId
        size: message.payload.size,
        collateral: message.payload.collateral,
        isLong: message.payload.isLong,
        entryPrice: message.payload.entryPrice,         // from PositionOpenedEvent
        entryFundingIndex: message.payload.entryFundingIndex, // new field
        feeToTreasury: message.payload.feeToTreasury,   // new field
        feeToBlp: message.payload.feeToBlp,             // new field
        timestamp: message.payload.timestamp,           // now string
        txSignature: message.payload.txSignature        // new field
      });
    }
  );

  // Example 4: Publishing and consuming position closed messages
  await dataBus.consume<PositionClosed>(
    STREAMS.position.closed,
    'settlement-service',
    'settlement-1',
    async (message) => {
      console.log('Received position closed:', {
        orderId: message.payload.orderId,               // from PositionClosedEvent
        positionId: message.payload.positionId,
        owner: message.payload.owner,                   // was: user
        basktId: message.payload.basktId,               // was: basketId
        size: message.payload.size,
        exitPrice: message.payload.exitPrice,
        pnl: message.payload.pnl,                       // i64 as string
        feeToTreasury: message.payload.feeToTreasury,   // new field
        feeToBlp: message.payload.feeToBlp,             // new field
        fundingPayment: message.payload.fundingPayment, // i128 as string
        settlementAmount: message.payload.settlementAmount, // new field
        poolPayout: message.payload.poolPayout,         // new field
        timestamp: message.payload.timestamp,           // now string
        txSignature: message.payload.txSignature        // new field
      });
    }
  );
}

// Run the example
example().catch(console.error);

// Environment variables for cluster mode:
// REDIS_CLUSTER_NODES=redis-node-1:6379,redis-node-2:6379,redis-node-3:6379
// REDIS_PASSWORD=your-cluster-password
// REDIS_TLS=true
// SIGNING_KEY=your-secret-signing-key
