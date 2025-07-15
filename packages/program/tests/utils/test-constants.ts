import { BN } from '@coral-xyz/anchor';
import { NAV_PRECISION } from '@baskt/sdk';

// Collateral ratio constants (matching the on-chain constants)
export const MIN_COLLATERAL_RATIO_BPS = 10000; // 100% minimum collateral
export const MIN_COLLATERAL_RATIO_DECIMAL = 1; // 100% as decimal

// Fee constants (matching the on-chain constants)
export const OPENING_FEE_BPS = 10; // 0.1%
export const CLOSING_FEE_BPS = 10; // 0.1%
export const LIQUIDATION_FEE_BPS = 50; // 0.5%

// NAV constants (matching the on-chain constants)
export const BASE_NAV = NAV_PRECISION.div(new BN(1e6)).toNumber(); // Base NAV value for new baskts ($100)
export const BASE_NAV_BN = NAV_PRECISION; // BASE_NAV with NAV_PRECISION decimals

// Price constants for testing (updated for $100 baseline NAV)
export const BASELINE_PRICE = NAV_PRECISION; // $100 with NAV_PRECISION decimals (new baseline)
export const LEGACY_BASELINE_PRICE = new BN(1_000_000); // $1 with 6 decimals (old baseline)

/**
 * Helper function to calculate NAV value with proper precision
 * @param navValueAsPercentage The NAV value as a percentage (e.g., 100 for $100)
 * @returns BN with proper precision
 */
export function calculateNAVWithPrecision(navValueAsPercentage: number): BN {
  return new BN(navValueAsPercentage).mul(NAV_PRECISION.div(new BN(100)));
}

// Helper function to calculate minimum collateral amount
export function calculateMinCollateral(notionalAmount: BN): BN {
  return notionalAmount.muln(MIN_COLLATERAL_RATIO_BPS).divn(10000);
}

// Helper function to calculate minimum collateral with buffer for fees
export function calculateMinCollateralWithBuffer(notionalAmount: BN, bufferPercent: number = 5): BN {
  const minCollateral = calculateMinCollateral(notionalAmount);
  const buffer = minCollateral.muln(bufferPercent).divn(100);
  return minCollateral.add(buffer);
} 