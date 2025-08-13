import BN from 'bn.js';
import {  COLLATERAL_MULTIPLIER, COLLATERAL_DENOMINATOR, BPS_DIVISOR, PRICE_PRECISION } from './const';

export interface CalculateSharesParams {
  collateral: number;
  price: number;
  leverage: number;
}

export interface CalculateLiquidationPriceParams extends CalculateSharesParams {
  position: 'long' | 'short';
  liquidationThresholdBps?: number;
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
  liquidationThresholdBps = 500,
}: CalculateLiquidationPriceParams): number => {
  const liquidationThreshold = liquidationThresholdBps / 10000;
  
  if (position === 'long') {
    return price * liquidationThreshold;
  } else {
    return price * (2 - liquidationThreshold);
  }
};

/**
 * Calculate the collateral amount required for a given position size
 * @param size - The position size in USDC
 * @returns The required collateral amount (110% of size)
 */
export const calculateCollateralAmount = (notionalValue: BN, openingFeeBps: BN = new BN(10)): BN => {
  const openingFee = notionalValue.mul(openingFeeBps).div(BPS_DIVISOR);
  const collateralAmount = notionalValue.add(openingFee);
  return collateralAmount;
};

/**
 * Calculate the number of contracts for a given USDC size and price
 * @param usdcSize - The position size in USDC and not in 10e6
 * @param price - The current price
 * @returns The number of contracts
 */
export const calculateNumContracts = (usdcSize: number, price: number): BN => {
  return new BN(usdcSize).mul(PRICE_PRECISION).div(new BN(price)).mul(PRICE_PRECISION);
}; 

export const calculateUsdcSize = (numContracts: BN, price: number): BN => {
  return numContracts.mul(new BN(price)).div(PRICE_PRECISION);
};