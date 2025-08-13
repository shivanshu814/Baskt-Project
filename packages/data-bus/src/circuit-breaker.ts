import { logger } from './utils';

export interface CircuitBreakerConfig {
  maxFailures?: number;
  maxAttempts?: number;
  openMs?: number;
  longDelayMs?: number;
}

export class CircuitBreaker {
  private failures = 0;
  private circuitOpenUntil = 0;
  
  constructor(
    private readonly config: CircuitBreakerConfig = {},
    private readonly name = 'unknown'
  ) {}

  /**
   * Called when an operation fails. Returns delay in ms to wait before retry.
   * Returns 0 if operation should proceed immediately.
   */
  onFailure(attempt: number): number {
    const maxFailures = this.config.maxFailures ?? 5;
    const maxAttempts = this.config.maxAttempts ?? 10;
    const openMs = this.config.openMs ?? 60_000;
    const longDelayMs = this.config.longDelayMs ?? 3_600_000;

    // Circuit is open - return long delay
    if (Date.now() < this.circuitOpenUntil) {
      return longDelayMs;
    }

    // Exceeded max attempts - open circuit if too many failures
    if (attempt > maxAttempts) {
      this.failures++;
      if (this.failures >= maxFailures) {
        this.circuitOpenUntil = Date.now() + openMs;
        logger.error('Circuit breaker OPEN', { 
          name: this.name,
          failures: this.failures,
          reopenAt: new Date(this.circuitOpenUntil).toISOString()
        });
      }
      return longDelayMs;
    }

    // Exponential backoff with jitter
    const base = Math.min(100 * Math.pow(2, attempt), 30_000);
    const jitter = base * 0.3 * Math.random();
    
    return Math.floor(base + jitter);
  }

  /**
   * Called when an operation succeeds. Resets failure count.
   */
  reset(): void {
    if (this.failures > 0) {
      logger.info('Circuit breaker reset', { name: this.name, previousFailures: this.failures });
    }
    this.failures = 0;
    this.circuitOpenUntil = 0;
  }

  /**
   * Check if circuit is currently open
   */
  isOpen(): boolean {
    return Date.now() < this.circuitOpenUntil;
  }
}

/**
 * Sleep utility for delays
 */
export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));
