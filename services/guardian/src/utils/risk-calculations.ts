import { BPS_DIVISOR, MAX_SLIPPAGE_BPS, PRICE_PRECISION } from '@baskt/sdk';
import BN from 'bn.js';

/**
 * Core risk calculation utilities that mirror on-chain logic
 * Single Responsibility: Pure calculation functions with no side effects
 */

/**
 * Calculate worst-case notional value for an order
 * Mirrors Order.calculate_worst_case_notional() from order.rs:119-143
 * @param size Order size in base units
 * @param limitPrice Limit price with 6 decimal precision
 * @param maxSlippageBps Maximum slippage in basis points
 * @returns Worst-case notional value
 */
export function calculateWorstCaseNotional(
  size: BN, 
  limitPrice: BN, 
  maxSlippageBps: BN
): BN {
  // Calculate base notional: size * limit_price / PRICE_PRECISION
  const baseNotional = size.mul(limitPrice).div(PRICE_PRECISION);
  
  // Calculate slippage adjustment
  const slippageAdjustment = baseNotional.mul(maxSlippageBps).div(BPS_DIVISOR);
  
  // Worst-case notional = base + slippage
  return baseNotional.add(slippageAdjustment);
}

/**
 * Calculate notional value without slippage
 * @param size Position size
 * @param price Price with 6 decimal precision
 * @returns Notional value
 */
export function calculateNotional(size: BN, price: BN): BN {
  return size.mul(price).div(PRICE_PRECISION);
}


/**
 * Validate that a value respects USDC decimal precision
 * @param value Value to validate
 * @returns true if valid precision
 */
export function isWholeNumberForPrecision(value: BN, precision: BN): boolean {
  return value.mod(precision).isZero();
}

/**
 * Validate price is within acceptable bounds
 * @param price Price to validate
 * @returns true if valid price
 */
export function isValidPrice(price: BN): boolean {
  // MIN_PRICE from on-chain constants
  return price.gte(new BN(1000)) && price.lte(new BN(10).pow(new BN(15))); // Max 1e15
}

/**
 * Validate slippage is within acceptable bounds
 * @param slippageBps Slippage in basis points
 * @returns true if valid slippage
 */
export function isValidSlippage(slippageBps: BN): boolean {
  return slippageBps.lte(MAX_SLIPPAGE_BPS) && slippageBps.gte(new BN(0));
}

/**
 * Calculate required collateral for a position
 * @param worstCaseNotional Worst-case notional value
 * @param minCollateralRatioBps Minimum collateral ratio in basis points
 * @param openingFeeBps Opening fee in basis points
 * @returns Required collateral amount
 */
export function calculateRequiredCollateral(
  worstCaseNotional: BN,
  minCollateralRatioBps: BN,
  openingFeeBps: BN
): BN {
  // Min collateral = worst_case_notional * min_collateral_ratio / BPS_DIVISOR
  const minCollateral = worstCaseNotional.mul(minCollateralRatioBps).div(BPS_DIVISOR);
  
  // Opening fee = worst_case_notional * opening_fee_bps / BPS_DIVISOR
  const openingFee = worstCaseNotional.mul(openingFeeBps).div(BPS_DIVISOR);
  
  // Total required = min_collateral + opening_fee
  return minCollateral.add(openingFee);
}

/**
 * Calculate the net exposure difference for a position
 * @param longExposure Total long exposure
 * @param shortExposure Total short exposure
 * @returns Absolute difference between long and short
 */
export function calculateExposureImbalance(longExposure: BN, shortExposure: BN): BN {
  return longExposure.sub(shortExposure).abs();
}

/**
 * Calculate imbalance ratio as a decimal
 * @param imbalance Absolute imbalance amount
 * @param totalExposure Total exposure (long + short)
 * @returns Imbalance ratio (0-1)
 */
export function calculateImbalanceRatio(imbalance: BN, totalExposure: BN): number {
  if (totalExposure.isZero()) {
    return 0;
  }
  // Convert to number for ratio calculation (safe for ratios)
  return imbalance.toNumber() / totalExposure.toNumber();
}
