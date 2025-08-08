import BN from 'bn.js';
export const PRICE_PRECISION_BN = new BN(10 ** 6);
export const COLLATERAL_MULTIPLIER = new BN(100); // 110% = 1.1x
export const COLLATERAL_DENOMINATOR = new BN(100);

export const BPS_DIVISOR = new BN(10000);

export const STANDARD_SLIPPAGE_BPS = new BN(300); // 3%