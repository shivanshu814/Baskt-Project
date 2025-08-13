import { redis } from '../config';

export class IdempotencyTracker {
  private static readonly TTL = 86400; // 24 hours

  static async recordTransaction(orderId: string, action: string, txSignature: string): Promise<void> {
    const key = `tx:${orderId}:${action}`;
    await redis.setex(key, this.TTL, txSignature);
  }

  static async getTransaction(orderId: string, action: string): Promise<string | null> {
    const key = `tx:${orderId}:${action}`;
    return await redis.get(key);
  }

  static async checkAndSet(orderId: string, action: string): Promise<boolean> {
    const key = `processing:${orderId}:${action}`;
    const result = await redis.set(key, '1', 'NX', 'EX', 300); // 5 min lock
    return result === 'OK';
  }
}