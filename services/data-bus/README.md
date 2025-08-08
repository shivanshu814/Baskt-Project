# Data-Bus Service

The Data-Bus service provides reliable pub/sub messaging for the Baskt perpetual protocol using Redis Streams.

## Features

- **Single DataBus class** with publish and consume methods
- **HMAC-SHA256 signing** of entire message envelope for security
- **At-least-once delivery** semantics with message acknowledgment
- **Dead letter queue** for invalid messages
- **JSON serialization** for simplicity
- **Prometheus metrics** for monitoring

## Installation

```bash
pnpm install
```

## Usage

### Single Redis Instance

```typescript
import { DataBus, STREAMS } from '@baskt/data-bus';

// Initialize (auto-connects by default)
const dataBus = new DataBus({
  redisUrl: 'redis://localhost:6379',
  signingKey: 'your-secret-signing-key',
  maxPayloadSize: 2097152,  // 2MB (optional, default 1MB)
  autoConnect: true         // default true
});

// For manual connection control
const dataBus = new DataBus({
  redisUrl: 'redis://localhost:6379',
  signingKey: 'your-secret-signing-key',
  autoConnect: false
});
await dataBus.connect();
```

### Redis Cluster Mode

```typescript
// Using the new constructor with full config object
const dataBus = new DataBus({
  redisCluster: {
    nodes: [
      { host: 'redis-node-1', port: 6379 },
      { host: 'redis-node-2', port: 6379 },
      { host: 'redis-node-3', port: 6379 }
    ],
    redisOptions: {
      password: 'cluster-password',
      tls: true
    }
  },
  signingKey: 'your-secret-signing-key',
  maxPayloadSize: 2097152,
  autoConnect: true
});

// Publish a message
await dataBus.publish(STREAMS.price.update, {
  asset: 'BTC',
  price: '50000.00',
  confidence: 0.99,
  sources: 3,
  timestamp: Date.now()
});

// Consume messages
await dataBus.consume(
  STREAMS.price.update,
  'oracle-service',  // Consumer group
  'oracle-1',        // Consumer name
  async (message) => {
    console.log('Received price:', message.payload);
    // Message is automatically acknowledged after handler completes
  },
  {
    count: 20,        // Read 20 messages at once (optional)
    blockMs: 5000     // Block for 5 seconds (optional)
  }
);
```

## Available Streams

- **Price feeds**: `STREAMS.price.update`, `STREAMS.price.nav`
- **Orders**: `STREAMS.order.request`, `STREAMS.order.accepted`, `STREAMS.order.rejected`
- **Positions**: `STREAMS.position.opened`, `STREAMS.position.closed`, `STREAMS.position.liquidated`
- **Risk**: `STREAMS.risk.liquidation`, `STREAMS.risk.funding`
- **System**: `STREAMS.system.snapshot`, `STREAMS.system.heartbeat`, `STREAMS.system.halt`
- **Transactions**: `STREAMS.transaction.submitted`, `STREAMS.transaction.confirmed`, `STREAMS.transaction.failed`

## Big Number Operations

The data-bus service includes BN utilities for precise numeric operations when working with string-based numeric values (common in blockchain applications):

```typescript
import { toBN, addBN, subBN, mulBN, divBN, cmpBN } from '@baskt/data-bus';

// Convert string numbers to BN and back
const bn = toBN('50000');           // Convert string to BN
const str = bn.toString(10);        // Convert BN back to string

// Arithmetic operations
const sum = addBN('1000', '2000');           // '3000'
const diff = subBN('5000', '1000');         // '4000'
const product = mulBN('100', '50');         // '5000'
const quotient = divBN('10000', '100');     // '100'

// Comparisons
const result = cmpBN('1000', '500');        // 1 (greater than)
const isZero = toBN('0').isZero();          // true
const isNeg = toBN('-100').isNeg();         // true
```

These utilities ensure precise arithmetic operations without JavaScript's floating-point precision issues.

## Security
All messages are signed with HMAC-SHA256 using the entire message envelope (not just the payload). Invalid signatures are sent to a dead letter queue for investigation.

## Environment Variables

- `REDIS_URL`: Redis connection URL
- `SIGNING_KEY`: Secret key for HMAC signing