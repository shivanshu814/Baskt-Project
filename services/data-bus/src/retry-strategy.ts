import { CircuitBreaker } from './circuit-breaker';

const connectionBreakers = new Map<string, CircuitBreaker>();

export function createRetryStrategy(redisUrl: string) {
  let breaker = connectionBreakers.get(redisUrl);
  if (!breaker) {
    breaker = new CircuitBreaker({
      maxFailures: 5,
      maxAttempts: 10,
      openMs: 60_000,
      longDelayMs: 3_600_000
    }, `redis-connection:${redisUrl}`);
    connectionBreakers.set(redisUrl, breaker);
  }

  return (times: number): number | null => {
    const delay = breaker!.onFailure(times);
    
    // Reset on successful connection (times === 1 means first attempt after success)
    if (times === 1) {
      breaker!.reset();
    }
    
    return delay;
  };
}