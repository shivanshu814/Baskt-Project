import { logger } from '@baskt/shared';

const throttleWindows = new Map<string, number>();

export function throttledLog(
  key: string,
  level: 'error' | 'warn' | 'info',
  message: string,
  meta?: any,
  windowMs = 60000
): void {
  const now = Date.now();
  const lastLogged = throttleWindows.get(key) || 0;
  
  if (now - lastLogged >= windowMs) {
    logger[level](message, meta);
    throttleWindows.set(key, now);
  }
}