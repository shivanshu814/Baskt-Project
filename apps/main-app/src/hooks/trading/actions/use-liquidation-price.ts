import { calculateLiquidationPrice } from '@baskt/sdk';
import { BasktInfo } from '@baskt/types';

export const useLiquidationPrice = () => {
  const getLiquidationPrice = (
    collateral: number,
    position: 'long' | 'short',
    basktPrice?: number,
  ) => {
    if (!basktPrice || collateral <= 0) return null;

    try {
      return calculateLiquidationPrice({
        collateral,
        price: basktPrice,
        leverage: 1,
        position,
      });
    } catch (error) {
      console.error('Error calculating liquidation price:', error);
      return null;
    }
  };

  const getLiquidationPriceFromBaskt = (
    collateral: number,
    position: 'long' | 'short',
    baskt: BasktInfo | null,
  ) => {
    if (!baskt?.price) return null;
    return getLiquidationPrice(collateral, position, baskt.price);
  };

  return {
    getLiquidationPrice,
    getLiquidationPriceFromBaskt,
  };
};
