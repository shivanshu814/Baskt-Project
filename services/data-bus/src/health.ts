import Redis, { Cluster } from 'ioredis';

export interface HealthStatus {
  connected: boolean;
  status: string;  // Use redis.status directly
  lastError?: string;
  uptime: number;
  metrics: {
    publishes: number;
    errors: number;
  };
}

export class HealthMonitor {
  private startTime = Date.now();
  private lastError?: Error;
  private publishes = 0;
  private errors = 0;

  constructor(private redis: Redis | Cluster) {
    redis.on('error', err => this.lastError = err);
  }

  recordPublish() { this.publishes++; }
  recordError() { this.errors++; }

  async getHealth(): Promise<HealthStatus> {
    const connected = this.redis.status === 'ready';
    try {
      if (connected) await this.redis.ping();
    } catch (e) {
      return { connected: false, status: 'error', ...this.getMetrics() };
    }
    return {
      connected,
      status: this.redis.status,
      lastError: this.lastError?.message,
      ...this.getMetrics()
    };
  }

  private getMetrics() {
    return {
      uptime: Date.now() - this.startTime,
      metrics: { publishes: this.publishes, errors: this.errors }
    };
  }
}