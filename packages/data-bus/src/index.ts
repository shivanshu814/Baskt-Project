import Redis, { Cluster } from 'ioredis';
import { EventEmitter } from 'events';
import { createHmac } from 'crypto';
import { ulid } from 'ulid';
import stringify from 'json-stable-stringify';
import BN from 'bn.js';

import {
  logger,
  MAX_PAYLOAD_SIZE,
  MAX_RETRY_ATTEMPTS
} from './utils';

import {
  pendingMessagesGauge,
  deadLetterCount,
  streamLengthGauge,
  messageSizeHistogram,
  messageRejectedCount,
  retryAttemptsGauge,
  connectionErrorCount,
  reconnectCount,
  messagePublishedCount,
  messageConsumedCount,
  messageProcessingTime,
} from './monitoring';

import { createRetryStrategy } from './retry-strategy';
import { CircuitBreaker, sleep } from './circuit-breaker';
import { HealthMonitor, HealthStatus } from './health';
import { MessageEnvelope, DataBusConfig, ConsumerConfig, RedisClusterConfig } from './types';
import { STREAMS, StreamName } from './types/streams';
import { getStreamConfig } from './stream-config';
import SuperJSON from 'superjson';

export class DataBus extends EventEmitter {
  private redis: Redis | Cluster;
  private signingKey: string;
  private isShuttingDown = false;
  private activeConsumers = new Set<AbortController>();
  private maxPayloadSize: number;
  private retryTracking = new Map<string, number>(); // messageId -> retry count
  private health: HealthMonitor;
  private publishBreaker: CircuitBreaker;
  private consumerBreakers = new Map<string, CircuitBreaker>(); // stream:group -> breaker
  private config: DataBusConfig;

  constructor(config: DataBusConfig) {
    super();
    // Validate and store config
    this.validateConfig(config);
    this.config = config;
    this.signingKey = config.signingKey;
    this.maxPayloadSize = config.maxPayloadSize ?? MAX_PAYLOAD_SIZE;
    
    // Initialize Redis client
    this.redis = this.createRedisClient(config);
    
    // Initialize health monitoring and circuit breakers
    this.health = new HealthMonitor(this.redis);
    this.publishBreaker = new CircuitBreaker({}, 'publish');
    
    // Setup event handlers and graceful shutdown
    this.setupEventHandlers();
    this.setupGracefulShutdown();
    
    // Auto-connect if needed
    if (config.autoConnect !== false) {
      this.startupValidation();
    }
  }

  private validateConfig(config: DataBusConfig): void {
    if (!config.redisUrl && !config.redisCluster) {
      throw new Error('Either redisUrl or redisCluster must be provided');
    }
    if (config.redisUrl && config.redisCluster) {
      throw new Error('Cannot provide both redisUrl and redisCluster');
    }
    if (!config.signingKey) {
      throw new Error('signingKey is required for message authentication');
    }
  }

  private createRedisClient(config: DataBusConfig): Redis | Cluster {
    const baseOptions = {
      maxRetriesPerRequest: config.maxRetriesPerRequest ?? 10,
      retryStrategy: createRetryStrategy(
        config.redisUrl || `cluster-${config.redisCluster?.nodes[0].host}`
      ),
      lazyConnect: config.autoConnect === false
    };

    if (config.redisCluster) {
      return this.createClusterClient(config.redisCluster, baseOptions);
    } else {
      return new Redis(config.redisUrl!, baseOptions);
    }
  }

  private createClusterClient(clusterConfig: RedisClusterConfig, baseOptions: any): Cluster {
    const nodes = clusterConfig.nodes.map(node => ({
      host: node.host,
      port: node.port
    }));

    return new Cluster(nodes, {
      redisOptions: {
        ...baseOptions,
        ...clusterConfig.redisOptions
      },
      enableReadyCheck: true,
      scaleReads: 'slave',
      clusterRetryStrategy: (times) => Math.min(times * 100, 3000)
    });
  }

  private setupEventHandlers(): void {
    // Add error event handlers to prevent unhandled errors
    ['error', 'close', 'end'].forEach(event => {
      this.redis.on(event, (err?: Error) => {
        logger.error(
          `Redis ${event}`,
          { err: err?.message, host: this.getRedisHost() }
        );
        connectionErrorCount.inc({ event });
        this.emit(event, err);
      });
    });
    
    // Track reconnection attempts
    this.redis.on('reconnecting', (delay: number) => {
      logger.info('Redis reconnecting', { host: this.getRedisHost() });
      reconnectCount.inc();
      this.emit('reconnecting', delay);
    });
    
    this.redis.on('ready', () => {
      logger.info('Redis connection ready', { host: this.getRedisHost() });
      this.emit('ready');
    });
  }

  private startupValidation(): void {
    this.redis.connect()
      .then(() => this.redis.ping())
      .then(() => {
        logger.info('DataBus startup validation passed');
        this.emit('startup:success');
      })
      .catch(err => {
        logger.error('DataBus startup validation failed', { err });
        this.emit('startup:error', err);
        
        if (this.config.exitOnStartupFailure !== false) {
          process.exit(1);
        }
      });
  }

  async connect(): Promise<void> {    
    await this.redis.connect();
  }

  async publish<T>(stream: StreamName, payload: T): Promise<string> {
    
    // Check payload size using custom serialization
    const payloadStr = serializeMessage(payload);
    const payloadSize = Buffer.byteLength(payloadStr);

    if (payloadSize > this.maxPayloadSize) {
      messageRejectedCount.inc({ stream, reason: 'payload_too_large' });
      throw new Error(`Payload size ${payloadSize} exceeds max ${this.maxPayloadSize} bytes`);
    }

    messageSizeHistogram.observe({ stream }, payloadSize);

    const envelope: MessageEnvelope<T> = {
      id: this.generateId(),
      type: stream,
      ts: Date.now(),
      payload: payload,
      sig: '', // Will be set after creating the envelope
      v: 1,
      producer: process.env.SERVICE_NAME || 'unknown'
    };

    // Sign entire envelope (not just payload)
    envelope.sig = this.sign(envelope);

    // Get stream config for retention policy
    const config = getStreamConfig(stream);

    // Build xadd command with trimming strategy
    const args: any[] = [stream];

    // Choose trimming strategy based on stream characteristics
    // we prioritize time-based trimming for compliance/audit streams
    // and size-based trimming for high-frequency operational streams
    if (config.retentionMs && !this.isHighFrequencyStream(stream)) {
      // Time-based trimming for audit/compliance streams
      const cutoffTime = Date.now() - config.retentionMs;
      const cutoffId = `${cutoffTime}-0`;
      args.push('MINID', '~', cutoffId);
    } else if (config.approxMaxLen) {
      // Size-based trimming for high-frequency streams
      args.push('MAXLEN', '~', config.approxMaxLen);
    }
    args.push('*', 'data', serializeMessage(envelope));

    try {
      // Cast to any to avoid TypeScript rest-parameter tuple mismatch during d.ts generation
      const id = await (this.redis as any).xadd(...args) as string;
      
      this.health.recordPublish();
      this.publishBreaker.reset();
      messagePublishedCount.inc({ stream });
      logger.debug('Published message', { stream, id });
      return id;
    } catch (err) {
      this.health.recordError();
      
      // Apply circuit breaker backoff on Redis errors
      const attempt = 1; // Simple retry attempt tracking
      const delay = this.publishBreaker.onFailure(attempt);
      if (delay > 0) {
        await sleep(delay);
      }
      
      throw err;
    }
  }

  /**
   * Consume messages from a Redis stream with guaranteed cleanup
   * 
   * IMPORTANT: This method uses a try/finally pattern to ensure the AbortController
   * is always removed from activeConsumers, even if an unexpected exception occurs.
   * This prevents hanging during graceful shutdown (fixes issue where leaked controllers
   * would cause the shutdown loop to wait indefinitely).
   */
  async consume<T>(
    stream: StreamName,
    group: string,
    consumer: string,
    handler: (msg: MessageEnvelope<T>) => Promise<void>,
    options?: Partial<ConsumerConfig>
  ): Promise<void> {
    const config: ConsumerConfig = {
      stream,
      group,
      consumer,
      blockMs: options?.blockMs ?? 1000,
      count: options?.count ?? 10,
      claimMinIdleMs: options?.claimMinIdleMs ?? 300000
    };

    const abortController = new AbortController();
    this.activeConsumers.add(abortController);
    
    try {
      // Get or create circuit breaker for this consumer
      const consumerKey = `${stream}:${group}`;
      let consumerBreaker = this.consumerBreakers.get(consumerKey);
      if (!consumerBreaker) {
        consumerBreaker = new CircuitBreaker({}, consumerKey);
        this.consumerBreakers.set(consumerKey, consumerBreaker);
      }
      // Create consumer group
      try {
        await this.redis.xgroup('CREATE', stream, group, '0', 'MKSTREAM');
      } catch (err: any) {
        // Group already exists - this is expected
        if (!err.message?.includes('BUSYGROUP')) {
          throw err;
        }
      }

      // Start background PEL monitor
      this.startPendingMonitor(config, abortController.signal);

      while (!this.isShuttingDown && !abortController.signal.aborted) {
        try {
          const messages = await this.redis.xreadgroup(
            'GROUP', group, consumer,
            'COUNT', config.count!,
            'BLOCK', config.blockMs!,
            'STREAMS', stream, '>'
          ) as [string, [string, string[]][]][] | null;

          if (!messages) continue;

          for (const [streamName, streamMessages] of messages) {
            for (const [id, fields] of streamMessages) {
              const timer = messageProcessingTime.startTimer({ stream, group });

              let data: MessageEnvelope<T>;
              try {
                data = deserializeMessage<MessageEnvelope<T>>(fields[1]);
              } catch (err) {
                logger.error('Message deserialization error', { err, id, stream });
                deadLetterCount.inc({ stream, reason: 'parse_error' });
                await this.redis.xadd(`${stream}:dead`, '*',
                  'data', fields[1],
                  'error', 'DESERIALIZATION_ERROR',
                  'originalId', id
                );
                await this.redis.xack(stream, group, id);
                timer();
                continue;
              }

              // Version compatibility check
              if (data.v && data.v > 1) {
                logger.warn('Message version higher than supported', {
                  version: data.v,
                  supportedVersion: 1,
                  id
                });
                // For now, attempt to process anyway - future versions should handle gracefully
              }

              if (!this.verify(data)) {
                logger.error('Invalid message signature', { id, stream });
                messageConsumedCount.inc({ stream, group, status: 'invalid' });
                // Add to dead letter queue
                await this.redis.xadd(`${stream}:dead`, '*', 'data', fields[1]);
                await this.redis.xack(stream, group, id);
                continue;
              }

              try {
                await handler(data);
                await this.redis.xack(stream, group, id);
                messageConsumedCount.inc({ stream, group, status: 'success' });
                // Clear retry tracking and reset circuit breaker on success
                this.retryTracking.delete(id);
                consumerBreaker.reset();
              } catch (err) {
                logger.error('Handler error', { err, id, stream });

                // Track retry attempts
                const retries = (this.retryTracking.get(id) || 0) + 1;
                this.retryTracking.set(id, retries);
                retryAttemptsGauge.set({ stream, messageId: id }, retries);
                
                // Apply circuit breaker backoff for handler errors (recoverable)
                const delay = consumerBreaker.onFailure(retries);
                if (delay > 0) {
                  await sleep(delay);
                }

                if (retries >= MAX_RETRY_ATTEMPTS) {
                  logger.error('Max retries exceeded, moving to dead letter', { id, retries });
                  deadLetterCount.inc({ stream, reason: 'max_retries' });
                  await this.redis.xadd(`${stream}:dead`, '*',
                    'data', fields[1],
                    'error', 'MAX_RETRIES_EXCEEDED',
                    'originalId', id,
                    'retries', retries.toString()
                  );
                  await this.redis.xack(stream, group, id);
                  this.retryTracking.delete(id);
                  messageConsumedCount.inc({ stream, group, status: 'dead_letter' });
                } else {
                  messageConsumedCount.inc({ stream, group, status: 'error' });
                  // Message will be redelivered
                }
              } finally {
                timer();
              }
            }
          }
        } catch (err: any) {
          if (err.message?.includes('NOGROUP')) {
            // Group was deleted, exit cleanly
            logger.info('Consumer group deleted, exiting', { stream, group });
            break;
          }
          logger.error('Consumer error', { err, stream, group });
          // Exponential backoff
          const backoff = Math.min(5000 * Math.pow(2, Math.random()), 30000);
          await sleep(backoff);
        }
      }
    } finally {
      // Guaranteed cleanup: Always remove the AbortController from activeConsumers
      // This prevents shutdown hangs if the consumer exits unexpectedly
      this.activeConsumers.delete(abortController);
    }
  }

  private generateId(): string {
    // Use ULID for sortable unique IDs
    return ulid();
  }

  private sign(envelope: MessageEnvelope<any>): string {
    // Create a copy without the signature field for signing
    const { sig, ...envelopeWithoutSig } = envelope;

    const hash = createHmac('sha256', this.signingKey);
    // Use canonical JSON for deterministic serialization
    const serialized = stringify(envelopeWithoutSig) || '';
    hash.update(serialized);
    return hash.digest('hex');
  }

  private verify(envelope: MessageEnvelope<any>): boolean {
    const expectedSig = this.sign(envelope);
    return envelope.sig === expectedSig;
  }

  private isHighFrequencyStream(stream: StreamName): boolean {
    // High-frequency streams that should use size-based trimming
    const highFrequencyStreams: StreamName[] = [
      STREAMS.price.update,
      STREAMS.risk.funding
    ];
    
    return highFrequencyStreams.includes(stream);
  }

  private async startPendingMonitor(
    config: ConsumerConfig,
    signal: AbortSignal
  ): Promise<void> {
    const checkInterval = 60000; // Check every minute

    const monitor = async () => {
      while (!signal.aborted) {
        try {
          // Get pending entries
          const pending = await this.redis.xpending(
            config.stream,
            config.group,
            '-',
            '+',
            100
          );

          if (pending && Array.isArray(pending)) {
            const pendingCount = pending.length;
            pendingMessagesGauge.set({ stream: config.stream, group: config.group }, pendingCount);

            // Claim old messages
            for (const entry of pending as any[]) {
              const [id, consumer, idleTime] = entry;
              if (parseInt(idleTime) > config.claimMinIdleMs!) {
                try {
                  await this.redis.xclaim(
                    config.stream,
                    config.group,
                    config.consumer,
                    config.claimMinIdleMs!,
                    id
                  );
                  logger.info('Claimed stale message', {
                    stream: config.stream,
                    id,
                    previousConsumer: consumer
                  });
                } catch (err) {
                  logger.error('Failed to claim message', { err, id });
                }
              }
            }
          }

          // Update stream length metric
          const streamLength = await this.redis.xlen(config.stream);
          streamLengthGauge.set({ stream: config.stream }, streamLength);
        } catch (err) {
          logger.error('Pending monitor error', { err, stream: config.stream });
        }

        await sleep(checkInterval);
      }
    };

    // Start monitor in background
    monitor().catch(err => {
      logger.error('Pending monitor crashed', { err });
    });
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);
      this.isShuttingDown = true;

      // Abort all active consumers
      this.activeConsumers.forEach(controller => {
        controller.abort();
      });

      // Wait for consumers to finish
      const timeout = setTimeout(() => {
        logger.warn('Graceful shutdown timeout, forcing exit');
        process.exit(1);
      }, 10000);

      while (this.activeConsumers.size > 0) {
        await sleep(100);
      }

      clearTimeout(timeout);
      await this.close();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  async close(): Promise<void> {
    this.isShuttingDown = true;
    try {
      await this.redis.quit();
    } catch (err) {
      // Ignore errors when closing - connection might already be closed
      logger.debug('Error during close (ignored)', { err: (err as Error).message });
    }
  }
  
  private getRedisHost(): string {
    if (this.redis instanceof Cluster) {
      return 'cluster';
    }
    return (this.redis as any).options?.host || 'unknown';
  }
  
  async getHealth(): Promise<HealthStatus> {
    return this.health.getHealth();
  }
}

// Export everything needed
export { getStreamConfig } from './stream-config';
export type {
  MessageEnvelope,
  StreamConfig,
  ConsumerConfig,
  DataBusConfig,
  RedisClusterConfig,
  RedisClusterNode
} from './types';
export type { HealthStatus } from './health';

// Export BN utilities for big number operations
export * from './utils/';
export * from './types';

SuperJSON.registerCustom<BN, string>(
  {
    isApplicable: (v): v is BN => v instanceof BN,
    serialize: v => v.toString(16),
    deserialize: v => new BN(v, 16),
  },
  'bn.js'
);


/**
 * Static utility function to serialize payloads with BN support
 * Converts BN instances to strings for JSON compatibility
 * @param payload - The payload to serialize
 * @returns Serialized JSON string
 */
export function serializeMessage<T>(payload: T): string {
  return SuperJSON.stringify(payload);
}

/**
 * Static utility function to deserialize payloads with BN support
 * Converts marked BN strings back to BN instances
 * @param data - The JSON string to deserialize
 * @returns Deserialized object with BN instances restored
 */
export function deserializeMessage<T>(data: string): T {
  return SuperJSON.parse(data);
}


