import { calculateCollateralAmount, calculateLiquidationPrice } from '@baskt/sdk';
import { BN } from '@coral-xyz/anchor';
import {
  Position,
  PositionCalculation,
  PositionTotals,
  TradeCalculation,
} from '../../types/trading/orders';

// Trade calculations
export const calculateTotalPositions = (positions: Position[]): PositionTotals => {
  const totals: PositionTotals = {
    long: 0,
    short: 0,
  };

  positions.forEach((position) => {
    if (position.isLong) {
      totals.long += Number(position.size || 0);
    } else {
      totals.short += Number(position.size || 0);
    }
  });

  return totals;
};

export const calculatePositionDetails = (
  position: Position,
  currentPrice: number,
): PositionCalculation => {
  const entryPriceBN = position.entryPrice;
  const sizeBN = position.size;

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

export const calculateLiquidationPriceForPosition = (
  collateral: number,
  position: 'long' | 'short',
  currentPrice: number,
): number | null => {
  if (!currentPrice || collateral <= 0) return null;

  try {
    return calculateLiquidationPrice({
      collateral,
      price: currentPrice,
      leverage: 1,
      position,
    });
  } catch (error) {
    console.error('Error calculating liquidation price:', error);
    return null;
  }
};

export const calculateTradeDetails = (
  size: string,
  currentPrice: number,
  selectedPosition: 'long' | 'short',
): TradeCalculation => {
  const sizeNum = Number(size) || 0;
  const positionSize = sizeNum > 0 && currentPrice ? (sizeNum / currentPrice) * 1e6 : 0;
  const collateral = calculateCollateralAmount(new BN(sizeNum)).toNumber();
  const liquidationPrice = calculateLiquidationPriceForPosition(
    sizeNum,
    selectedPosition,
    currentPrice,
  );
  const fees = sizeNum * 0.002; // 0.2% fee

  return {
    positionSize,
    collateral,
    liquidationPrice: liquidationPrice || undefined,
    fees,
  };
};

export const calculateSizeFromPercentage = (percentage: number, usdcBalance: string): string => {
  const usdcBalanceNum = Number(usdcBalance) || 0;
  if (usdcBalanceNum > 0) {
    const newSize = (percentage / 100) * usdcBalanceNum;
    return newSize.toFixed(2);
  }
  return '0';
};

export const calculatePercentageFromSize = (size: string, usdcBalance: string): number => {
  const usdcBalanceNum = Number(usdcBalance) || 0;
  if (usdcBalanceNum > 0 && size) {
    const sizeNum = Number(size) || 0;
    const percentage = Math.min((sizeNum / usdcBalanceNum) * 100, 100);
    return Math.round(percentage);
  }
  return 0;
};

// Form calculations
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

// Position calculations
export const getLiquidationPrice = (
  collateral: number,
  position: 'long' | 'short',
  currentPrice: number,
) => {
  if (!currentPrice || collateral <= 0) return null;

  try {
    // This would typically use the SDK's calculateLiquidationPrice
    // For now, returning a simple calculation
    const leverage = 1; // Default leverage
    const marginRatio = 0.1; // 10% margin requirement

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
