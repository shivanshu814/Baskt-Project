import BN  from 'bn.js';

/**
 * Convert BN or string to number
 * @param value - BN or string value to convert
 * @returns number representation
 */
export function toNumber(value: BN | string | number): number {
  if (typeof value === 'string') {
    return parseInt(value);
  }
  if(value instanceof BN){
    return value.toNumber();
  }
  return value;
}

/**
 * Convert BN or string to number with fallback
 * @param value - BN or string value to convert
 * @param fallback - fallback value if conversion fails
 * @returns number representation or fallback
 */
export function toNumberWithFallback(value: BN | string | null | undefined, fallback: number = 0): number {
  if (value === null || value === undefined) {
    return fallback;
  }
  return toNumber(value);
}

/**
 * Convert BN-like, bigint, string, or number into BN safely.
 */
export function toBN(value: BN | bigint | string | number | null | undefined): BN {
  if (value === null || value === undefined) return new BN(0);
  if (value instanceof BN) return value;
  if (typeof value === 'bigint') return new BN(value.toString());
  if (typeof value === 'string') return new BN(value, 10);
  if (typeof value === 'number') return new BN(value);
  // Fallback to string conversion if possible
  try {
    // @ts-ignore
    return new BN((value as any).toString());
  } catch {
    return new BN(0);
  }
}
