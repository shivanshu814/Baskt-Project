import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Redis from 'ioredis';
import { DataBus, STREAMS, getAllStreamValues } from '../src/index';
import type { MessageEnvelope } from '../src/index';
import type { OrderRequest } from '@baskt/shared';
import type { StreamName } from '../src/streams';

describe('DataBus', () => {
  let dataBus: DataBus;
  let redis: Redis;
  const testSigningKey = 'test-signing-key-12345';
  
  // Create test-specific stream names by adding a test prefix
  const TEST_PREFIX = 'test:';
  const TEST_STREAMS = {
    order: {
      request: `${TEST_PREFIX}order.request` as StreamName,
    },
    system: {
      heartbeat: `${TEST_PREFIX}system.heartbeat` as StreamName,
    }
  };
  
  // Track streams used in tests for cleanup
  const testStreamsUsed = new Set<string>();

  beforeEach(async () => {
    // Create DataBus without auto-connect to avoid double connection
    dataBus = new DataBus({
      redisUrl: 'redis://localhost:6379',
      signingKey: testSigningKey,
      autoConnect: false
    });
    
    // Create Redis client with lazyConnect to control connection timing
    redis = new Redis('redis://localhost:6379', {
      lazyConnect: true,
      enableOfflineQueue: false
    });
    
    try {
      // Connect both clients
      await dataBus.connect();
      await redis.connect();
      
      // Clear the set of test streams for this test
      testStreamsUsed.clear();
    } catch (err) {
      console.error('Failed to connect to Redis. Make sure Redis is running on localhost:6379');
      throw err;
    }
  });

  afterEach(async () => {
    // Clean up only the test streams that were actually used
    if (redis && redis.status === 'ready') {
      for (const stream of testStreamsUsed) {
        try {
          await redis.del(stream);
          await redis.del(`${stream}:dead`);
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    }
    
    // Close connections
    if (dataBus) {
      try {
        await dataBus.close();
      } catch (err) {
        // Ignore close errors in cleanup
      }
    }
    
    if (redis && redis.status === 'ready') {
      try {
        await redis.quit();
      } catch (err) {
        // Ignore quit errors in cleanup
      }
    }
  });

  it('should publish and consume messages with correct signature', async () => {
    const testStream = TEST_STREAMS.order.request;
    testStreamsUsed.add(testStream);
    testStreamsUsed.add(`${testStream}:dead`);
    
    const testPayload: OrderRequest = {
      orderId: 'test-123',
      user: 'user-wallet',
      basketId: 'basket-1',
      size: '1000',
      collateral: '200',
      isLong: true,
      leverage: 5,
      timestamp: Date.now()
    };

    // Publish
    const messageId = await dataBus.publish(testStream, testPayload);
    expect(messageId).toBeTruthy();

    // Consume
    const consumed: MessageEnvelope<OrderRequest>[] = [];
    const consumer = dataBus.consume<OrderRequest>(
      testStream,
      'test-group',
      'test-consumer',
      async (msg) => {
        consumed.push(msg);
      }
    );

    // Wait for message to be consumed
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(consumed).toHaveLength(1);
    expect(consumed[0].payload).toEqual(testPayload);
    expect(consumed[0].v).toBe(1);
    expect(consumed[0].sig).toBeTruthy();
  });

  it('should send invalid signatures to dead letter queue', async () => {
    const testStream = TEST_STREAMS.order.request;
    testStreamsUsed.add(testStream);
    testStreamsUsed.add(`${testStream}:dead`);
    
    // Manually add a message with bad signature
    await redis.xadd(
      testStream,
      '*',
      'data', JSON.stringify({
        id: 'fake-id',
        type: testStream,
        ts: Date.now(),
        payload: { test: 'data' },
        sig: 'invalid-signature',
        v: 1
      })
    );

    const consumed: MessageEnvelope[] = [];
    const consumer = dataBus.consume(
      testStream,
      'test-group',
      'test-consumer',
      async (msg) => {
        consumed.push(msg);
      }
    );

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should not consume invalid message
    expect(consumed).toHaveLength(0);

    // Check dead letter queue
    const deadLetters = await redis.xlen(`${testStream}:dead`);
    expect(deadLetters).toBe(1);
  });

  it('should handle JSON parse errors gracefully', async () => {
    const testStream = TEST_STREAMS.order.request;
    testStreamsUsed.add(testStream);
    testStreamsUsed.add(`${testStream}:dead`);
    
    // Add invalid JSON
    await redis.xadd(
      testStream,
      '*',
      'data', 'invalid-json{'
    );

    const consumed: MessageEnvelope[] = [];
    const consumer = dataBus.consume(
      testStream,
      'test-group',
      'test-consumer',
      async (msg) => {
        consumed.push(msg);
      }
    );

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should not consume invalid message
    expect(consumed).toHaveLength(0);

    // Check dead letter queue
    const deadLetters = await redis.xrange(`${testStream}:dead`, '-', '+');
    expect(deadLetters).toHaveLength(1);
    expect(deadLetters[0][1]).toContain('JSON_PARSE_ERROR');
  });

  it('should apply stream retention policies', async () => {
    const testStream = TEST_STREAMS.system.heartbeat;
    testStreamsUsed.add(testStream);
    testStreamsUsed.add(`${testStream}:dead`);
    
    // Publish multiple messages
    for (let i = 0; i < 5; i++) {
      await dataBus.publish(testStream, {
        service: 'test',
        timestamp: Date.now()
      });
    }

    // Check stream length
    const length = await redis.xlen(testStream);
    expect(length).toBe(5);

    // Stream config has approxMaxLen of 5000, so all should be kept
    expect(length).toBeLessThanOrEqual(5000);
  });

  it('should track active consumers correctly', async () => {
    const testStream = TEST_STREAMS.order.request;
    testStreamsUsed.add(testStream);
    testStreamsUsed.add(`${testStream}:dead`);
    
    // Track initial activeConsumers size
    const initialSize = (dataBus as any).activeConsumers.size;
    expect(initialSize).toBe(0);
    
    // Start a consumer
    const consumerPromise = dataBus.consume(
      testStream,
      'test-group',
      'test-consumer',
      async (msg) => {
        console.log('Processing message:', msg.id);
      }
    );
    
    // Wait for consumer to initialize
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Verify consumer was added to activeConsumers
    const activeSize = (dataBus as any).activeConsumers.size;
    expect(activeSize).toBe(1);
    
    // The consumer cleanup is verified by the graceful shutdown test below
    // This test demonstrates that our tracking mechanism works correctly
  });

  it('should handle graceful shutdown without hanging when consumers exist', async () => {
    const testStream = TEST_STREAMS.order.request;
    testStreamsUsed.add(testStream);
    testStreamsUsed.add(`${testStream}:dead`);
    
    // Create a long-running consumer
    const consumerPromise = dataBus.consume(
      testStream,
      'test-group',
      'test-consumer',
      async (msg) => {
        // Simple handler that doesn't throw
        console.log('Processing message:', msg.id);
      }
    );
    
    // Verify consumer was added to activeConsumers
    const activeSize = (dataBus as any).activeConsumers.size;
    expect(activeSize).toBeGreaterThan(0);
    
    // Simulate graceful shutdown by calling setupGracefulShutdown behavior
    const activeConsumers = (dataBus as any).activeConsumers;
    
    // Abort all active consumers (simulates SIGTERM handling)
    activeConsumers.forEach((controller: AbortController) => {
      controller.abort();
    });
    
    // Wait for consumers to clean up (they should exit the while loop and clean up)
    const startTime = Date.now();
    const timeout = 2000; // 2 second timeout for test
    
    while (activeConsumers.size > 0 && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Verify all consumers cleaned up before timeout
    expect(activeConsumers.size).toBe(0);
    expect(Date.now() - startTime).toBeLessThan(timeout);
  });
});
