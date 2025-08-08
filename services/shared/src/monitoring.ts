import { Histogram, Counter, Gauge, register } from 'prom-client';
import winston from 'winston';

// Metrics
export const orderProcessingTime = new Histogram({
  name: 'guardian_order_processing_seconds',
  help: 'Time to process order requests',
  labelNames: ['status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
});

export const liquidationCount = new Counter({
  name: 'liquidations_total',
  help: 'Total number of liquidations',
  labelNames: ['basket', 'type']
});

export const tvlGauge = new Gauge({
  name: 'protocol_tvl_usdc',
  help: 'Total value locked in protocol'
});

export const utilizationGauge = new Gauge({
  name: 'protocol_utilization_ratio',
  help: 'Protocol utilization ratio',
  labelNames: ['basket']
});

// Data Bus specific metrics
export const messagePublishedCount = new Counter({
  name: 'databus_messages_published_total',
  help: 'Total number of messages published',
  labelNames: ['stream']
});

export const messageConsumedCount = new Counter({
  name: 'databus_messages_consumed_total',
  help: 'Total number of messages consumed',
  labelNames: ['stream', 'group', 'status']
});

export const messageProcessingTime = new Histogram({
  name: 'databus_message_processing_seconds',
  help: 'Time to process messages',
  labelNames: ['stream', 'group'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
});

// Safe metric registration - prevents duplicate registration errors
function registerMetricSafe(metric: any): void {
  const existingMetric = register.getSingleMetric(metric.name);
  if (!existingMetric) {
    register.registerMetric(metric);
  }
}

// Register all metrics safely
registerMetricSafe(orderProcessingTime);
registerMetricSafe(liquidationCount);
registerMetricSafe(tvlGauge);
registerMetricSafe(utilizationGauge);
registerMetricSafe(messagePublishedCount);
registerMetricSafe(messageConsumedCount);
registerMetricSafe(messageProcessingTime);

// Additional metrics for Data-Bus monitoring
export const pendingMessagesGauge = new Gauge({
  name: 'databus_pending_messages',
  help: 'Number of pending messages in consumer group',
  labelNames: ['stream', 'group']
});

export const deadLetterCount = new Counter({
  name: 'databus_dead_letter_total',
  help: 'Total messages sent to dead letter queue',
  labelNames: ['stream', 'reason']
});

export const streamLengthGauge = new Gauge({
  name: 'databus_stream_length',
  help: 'Current length of Redis stream',
  labelNames: ['stream']
});

export const messageSizeHistogram = new Histogram({
  name: 'databus_message_size_bytes',
  help: 'Size of messages in bytes',
  labelNames: ['stream'],
  buckets: [100, 1000, 10000, 100000, 500000, 1000000, 5000000]
});

export const messageRejectedCount = new Counter({
  name: 'databus_messages_rejected_total',
  help: 'Total messages rejected',
  labelNames: ['stream', 'reason']
});

export const retryAttemptsGauge = new Gauge({
  name: 'databus_message_retry_attempts',
  help: 'Current retry attempts for messages',
  labelNames: ['stream', 'messageId']
});

// Connection health metrics
export const connectionErrorCount = new Counter({
  name: 'databus_connection_errors_total',
  help: 'Total Redis connection errors by event type',
  labelNames: ['event']
});

export const reconnectCount = new Counter({
  name: 'databus_reconnect_attempts_total',
  help: 'Total Redis reconnection attempts'
});

registerMetricSafe(pendingMessagesGauge);
registerMetricSafe(deadLetterCount);
registerMetricSafe(streamLengthGauge);
registerMetricSafe(messageSizeHistogram);
registerMetricSafe(messageRejectedCount);
registerMetricSafe(retryAttemptsGauge);
registerMetricSafe(connectionErrorCount);
registerMetricSafe(reconnectCount);

// Logger setup with environment-aware transports
const transports: winston.transport[] = [];

if (process.env.NODE_ENV === 'development') {
  // Colorized console output for development
  transports.push(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
} else {
  // JSON output for production
  transports.push(new winston.transports.Console({
    format: winston.format.json()
  }));
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true })
  ),
  transports
});