import BN from 'bn.js';
import { CalculateSharesParams, CalculateLiquidationPriceParams } from '../../../types/baskt';

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

//TODO we should be reading from the constants in constant
export const calculateCollateralAmount = (size: BN): BN => {
  return size.muln(110).divn(100);
};
