import { Position, PositionCalculation } from '../../types/baskt/trading/orders';

export const calculatePositionDetails = (
  position: Position,
  currentPrice: number,
): PositionCalculation => {
  const entryPriceBN = position.entryPrice;
  const sizeBN = position.remainingSize;
  const convertBNToNumber = (value: any, divisor: number = 1): number => {
    if (!value) return 0;

    if (typeof value === 'string') {
      return Number(value) / divisor;
    }

    if (value && typeof value === 'object' && 'toNumber' in value) {
      return value.toNumber() / divisor;
    }

    return Number(value) / divisor;
  };

  const entryPrice = entryPriceBN ? convertBNToNumber(entryPriceBN, 1e6) : currentPrice;

  const size = convertBNToNumber(sizeBN, 1);

  const validEntryPrice = isNaN(entryPrice) ? currentPrice : entryPrice * 1e6;
  const validSize = isNaN(size) ? 0 : size;
  const validCurrentPrice = isNaN(currentPrice) ? 0 : currentPrice;

  const positionValue = (validSize * validCurrentPrice) / 1e6;
  const entryValue = (validSize * validEntryPrice) / 1e6;
  const pnl = positionValue - entryValue;
  const pnlPercentage = entryValue > 0 ? (pnl / entryValue) * 100 : 0;
  const fees = positionValue * 0.002; // 0.2% fee

  return {
    positionValue,
    entryValue,
    pnl,
    pnlPercentage,
    fees,
    entryPrice: validEntryPrice,
    currentPrice: validCurrentPrice,
  };
};

export const calculateAmount = (percentage: number, positionSize: number): string => {
  return ((percentage / 100) * positionSize).toFixed(2);
};

export const calculatePercentage = (amount: number, maxAmount: number): string => {
  if (amount <= 0 || maxAmount <= 0) return '';
  return ((amount / maxAmount) * 100).toFixed(1);
};

export const calculateAmountFromPercentage = (percentage: number, maxAmount: number): string => {
  const amount = (percentage / 100) * maxAmount;
  return amount.toFixed(6).replace(/\.?0+$/, '');
};

export function calculateCurrentPercentage(percentage: string | number): number {
  return Math.round(parseFloat(percentage?.toString() || '0'));
}

export const getLiquidationPrice = (
  collateral: number,
  position: 'long' | 'short',
  currentPrice: number,
) => {
  if (!currentPrice || collateral <= 0) return null;

  try {
    const leverage = 1;
    const marginRatio = 0.1;

    if (position === 'long') {
      return currentPrice * (1 - marginRatio);
    } else {
      return currentPrice * (1 + marginRatio);
    }
  } catch (error) {
    console.error('Error calculating liquidation price:', error);
    return null;
  }
};
