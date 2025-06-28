import BN from 'bn.js';
import { PRICE_PRECISION_BN, COLLATERAL_MULTIPLIER, COLLATERAL_DENOMINATOR } from './const';

export interface CalculateSharesParams {
  collateral: number;
  price: number;
  leverage: number;
}

export interface CalculateLiquidationPriceParams extends CalculateSharesParams {
  position: 'long' | 'short';
}

export const calculateEstimatedShares = ({
  collateral,
  price,
  leverage,
}: CalculateSharesParams): number => {
  return (collateral / price) * leverage;
};

export const calculateLiquidationPrice = ({
  collateral,
  price,
  leverage,
  position,
}: CalculateLiquidationPriceParams): number => {
  const positionSize = collateral / leverage;
  const ratio = collateral / positionSize;

  if (position === 'long') {
    return price * (1 - (ratio - 1));
  } else {
    return price * (1 + (ratio - 1));
  }
};

/**
 * Calculate the collateral amount required for a given position size
 * @param size - The position size in USDC
 * @returns The required collateral amount (110% of size)
 */
export const calculateCollateralAmount = (size: BN): BN => {
  return size.mul(COLLATERAL_MULTIPLIER).div(COLLATERAL_DENOMINATOR);
};

/**
 * Calculate the number of contracts for a given USDC size and price
 * @param usdcSize - The position size in USDC and not in 10e6
 * @param price - The current price
 * @returns The number of contracts
 */
export const calculateNumContracts = (usdcSize: number, price: number): BN => {
  return new BN(usdcSize).mul(PRICE_PRECISION_BN).div(new BN(price)).mul(PRICE_PRECISION_BN);
}; 

export const calculateUsdcSize = (numContracts: BN, price: number): BN => {
  return numContracts.mul(new BN(price)).div(PRICE_PRECISION_BN);
};