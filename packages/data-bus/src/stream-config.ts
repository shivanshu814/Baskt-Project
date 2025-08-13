import { StreamConfig } from './types';
import { STREAMS } from './types/streams';

// Default stream configurations with retention policies
export const STREAM_CONFIGS: Record<string, StreamConfig> = {
  // High-frequency streams - shorter retention
  [STREAMS.price.update]: {
    name: STREAMS.price.update,
    approxMaxLen: 10000,  // Keep last ~10k price updates
    retentionMs: 3600000  // 1 hour
  },
  [STREAMS.price.nav]: {
    name: STREAMS.price.nav,
    approxMaxLen: 10000,
    retentionMs: 3600000
  },

  // Order lifecycle - medium retention
  [STREAMS.order.request]: {
    name: STREAMS.order.request,
    approxMaxLen: 50000,
    retentionMs: 86400000  // 24 hours
  },
  [STREAMS.order.accepted]: {
    name: STREAMS.order.accepted,
    approxMaxLen: 50000,
    retentionMs: 86400000
  },
  [STREAMS.order.rejected]: {
    name: STREAMS.order.rejected,
    approxMaxLen: 20000,
    retentionMs: 86400000
  },

  // Position lifecycle - longer retention for audit
  [STREAMS.position.opened]: {
    name: STREAMS.position.opened,
    approxMaxLen: 100000,
    retentionMs: 604800000  // 7 days
  },
  [STREAMS.position.closed]: {
    name: STREAMS.position.closed,
    approxMaxLen: 100000,
    retentionMs: 604800000
  },
  [STREAMS.position.liquidated]: {
    name: STREAMS.position.liquidated,
    approxMaxLen: 50000,
    retentionMs: 2592000000  // 30 days for compliance
  },

  // Risk events - critical retention
  [STREAMS.risk.liquidation]: {
    name: STREAMS.risk.liquidation,
    approxMaxLen: 50000,
    retentionMs: 604800000  // 7 days
  },
  [STREAMS.risk.funding]: {
    name: STREAMS.risk.funding,
    approxMaxLen: 10000,
    retentionMs: 604800000
  },

  // System events
  [STREAMS.system.snapshot]: {
    name: STREAMS.system.snapshot,
    approxMaxLen: 10000,
    retentionMs: 2592000000  // 30 days
  },
  [STREAMS.system.heartbeat]: {
    name: STREAMS.system.heartbeat,
    approxMaxLen: 5000,
    retentionMs: 3600000  // 1 hour
  },
  [STREAMS.system.halt]: {
    name: STREAMS.system.halt,
    approxMaxLen: 1000,
    retentionMs: 2592000000  // 30 days
  },

  // Transaction events
  [STREAMS.transaction.submitted]: {
    name: STREAMS.transaction.submitted,
    approxMaxLen: 50000,
    retentionMs: 86400000
  },
  [STREAMS.transaction.confirmed]: {
    name: STREAMS.transaction.confirmed,
    approxMaxLen: 50000,
    retentionMs: 604800000  // 7 days
  },
  [STREAMS.transaction.failed]: {
    name: STREAMS.transaction.failed,
    approxMaxLen: 20000,
    retentionMs: 604800000
  }
};

export function getStreamConfig(stream: string): StreamConfig {
  return STREAM_CONFIGS[stream] || {
    name: stream,
    approxMaxLen: 100000,  // Default fallback
    retentionMs: 86400000  // 24 hours default
  };
}
