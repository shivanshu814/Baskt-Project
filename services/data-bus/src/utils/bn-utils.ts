import BN from 'bn.js';

/**
 * Utility functions for handling big number operations in the data-bus service
 * These functions help convert between string representations and BN instances
 */

/**
 * Convert a string number to a BN instance
 * @param value - String representation of a number
 * @returns BN instance
 */
export function toBN(value: string | number): BN {
  if (typeof value === 'string') {
    return new BN(value, 10);
  }
  return new BN(value);
}

/**
 * Convert a BN instance to a string
 * @param bn - BN instance
 * @returns String representation
 */
export function fromBN(bn: BN): string {
  return bn.toString(10);
}

/**
 * Add two string numbers using BN
 * @param a - First number as string
 * @param b - Second number as string
 * @returns Sum as string
 */
export function addBN(a: string, b: string): string {
  return toBN(a).add(toBN(b)).toString(10);
}

/**
 * Subtract two string numbers using BN
 * @param a - First number as string
 * @param b - Second number as string
 * @returns Difference as string
 */
export function subBN(a: string, b: string): string {
  return toBN(a).sub(toBN(b)).toString(10);
}

/**
 * Multiply two string numbers using BN
 * @param a - First number as string
 * @param b - Second number as string
 * @returns Product as string
 */
export function mulBN(a: string, b: string): string {
  return toBN(a).mul(toBN(b)).toString(10);
}

/**
 * Divide two string numbers using BN
 * @param a - First number as string
 * @param b - Second number as string
 * @returns Quotient as string
 */
export function divBN(a: string, b: string): string {
  return toBN(a).div(toBN(b)).toString(10);
}

/**
 * Compare two string numbers using BN
 * @param a - First number as string
 * @param b - Second number as string
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function cmpBN(a: string, b: string): number {
  return toBN(a).cmp(toBN(b));
}

/**
 * Check if a string number is zero using BN
 * @param value - Number as string
 * @returns True if zero
 */
export function isZeroBN(value: string): boolean {
  return toBN(value).isZero();
}

/**
 * Check if a string number is negative using BN
 * @param value - Number as string
 * @returns True if negative
 */
export function isNegBN(value: string): boolean {
  return toBN(value).isNeg();
}

/**
 * Get the absolute value of a string number using BN
 * @param value - Number as string
 * @returns Absolute value as string
 */
export function absBN(value: string): string {
  return toBN(value).abs().toString(10);
} 