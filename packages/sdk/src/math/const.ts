import BN from 'bn.js';

export const PRICE_PRECISION = new BN(10 ** 6);
export const NAV_PRECISION = PRICE_PRECISION.mul(new BN(100)); // 10^8 = 100 * 10^6 to account for BASE_NAV of 100

export const USDC_DECIMALS = 6;
export const COLLATERAL_MULTIPLIER = new BN(100); // 110% = 1.1x
export const COLLATERAL_DENOMINATOR = new BN(100);

export const BPS_DIVISOR = new BN(10000);

export const STANDARD_SLIPPAGE_BPS = new BN(300); // 3%

export const MAX_SLIPPAGE_BPS = new BN(1000); // 10%

export const MAX_ORDER_SIZE = new BN(1_000_000).mul(PRICE_PRECISION); // 1 USDC