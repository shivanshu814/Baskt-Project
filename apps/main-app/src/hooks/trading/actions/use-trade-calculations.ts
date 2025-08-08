import { useMemo } from 'react';
import { Position } from '../../../types/trading/orders';
import {
  calculateTotalPositions,
  calculateTradeDetails,
} from '../../../utils/calculation/calculations';

export const useTradeCalculations = (
  size: string,
  currentPrice: number,
  selectedPosition: 'long' | 'short',
  positions: Position[],
) => {
  const tradeDetails = useMemo(() => {
    return calculateTradeDetails(size, currentPrice, selectedPosition);
  }, [size, currentPrice, selectedPosition]);

  const positionTotals = useMemo(() => {
    return calculateTotalPositions(positions);
  }, [positions]);

  return {
    tradeDetails,
    positionTotals,
  };
};
