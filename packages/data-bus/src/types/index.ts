export interface MessageEnvelope<T = any> {
  id: string;          // ULID for sortable unique IDs
  type: string;        // Stream name
  ts: number;          // Timestamp
  payload: T;          // Actual message payload
  v: number;           // Version (1)
  producer?: string;   // Optional producer identifier
}

export interface StreamConfig {
  name: string;
  maxLen?: number;          // Maximum stream length (exact)
  approxMaxLen?: number;    // Approximate max length for XADD (~)
  retentionMs?: number;     // Retention time in milliseconds
}

export interface ConsumerConfig {
  stream: string;
  group: string;
  consumer: string;
  blockMs?: number;    // Block timeout in milliseconds (default: 1000)
  count?: number;      // Number of messages to read at once (default: 10)
  claimMinIdleMs?: number; // Min idle time before claiming (default: 300000 = 5min)
}

export interface RedisClusterNode {
  host: string;
  port: number;
}

export interface RedisClusterConfig {
  nodes: RedisClusterNode[];
  redisOptions?: {
    password?: string;
    tls?: any; // ioredis expects ConnectionOptions, but boolean is commonly used
  };
}

export interface DataBusConfig {
  redisUrl?: string;
  redisCluster?: RedisClusterConfig;
  maxRetriesPerRequest?: number;
  retryDelayMs?: number;
  maxPayloadSize?: number;  // Maximum payload size in bytes (default: 1MB)
  autoConnect?: boolean;    // Auto-connect on construction (default: true)
  exitOnStartupFailure?: boolean;  // Exit process on startup validation failure (default: true)
}

export * from './streams';  
export * from './messages'