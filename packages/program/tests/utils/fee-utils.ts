import BN from 'bn.js';

/**
 * Basis points divisor (10,000 = 100%)
 */
export const BPS_DIVISOR = new BN(10_000);

/**
 * Generic fee calculation helper
 * amount * fee_bps / BPS_DIVISOR
 */
export function calcFee(amount: BN, feeBps: BN): BN {
  return amount.mul(feeBps).div(BPS_DIVISOR);
}

/**
 * Compute net collateral after deducting opening fee from collateral
 */
export function netCollateral(collateral: BN, size: BN, openingFeeBps: BN): BN {
  return collateral.sub(calcFee(size, openingFeeBps));
}
