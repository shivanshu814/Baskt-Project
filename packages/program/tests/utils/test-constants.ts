import { BN } from '@coral-xyz/anchor';

// Collateral ratio constants (matching the on-chain constants)
export const MIN_COLLATERAL_RATIO_BPS = 10000; // 100% minimum collateral
export const MIN_COLLATERAL_RATIO_DECIMAL = 1; // 100% as decimal

// Fee constants (matching the on-chain constants)
export const OPENING_FEE_BPS = 10; // 0.1%
export const CLOSING_FEE_BPS = 10; // 0.1%
export const LIQUIDATION_FEE_BPS = 50; // 0.5%

// NAV constants (matching the on-chain constants)
export const BASE_NAV = 1; // Base NAV value for new baskts ($1)
export const BASE_NAV_BN = new BN(1_000_000); // $1 with 6 decimal places

// Price constants for testing (updated for $1 baseline NAV)
export const BASELINE_PRICE = new BN(1_000_000); // $1 with 6 decimals (new baseline)
export const LEGACY_BASELINE_PRICE = new BN(100_000_000); // $100 with 6 decimals (old baseline)

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