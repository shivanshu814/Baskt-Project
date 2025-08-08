import { useMemo } from 'react';
import { calculatePositionDetails } from '../../../utils/calculation/calculations';

export function usePositionsTab(positions: any[], basktPrice: number) {
  const processedPositions = useMemo(() => {
    return positions.map((position) => {
      const calculations = calculatePositionDetails(position, basktPrice);
      return {
        ...position,
        calculations,
      };
    });
  }, [positions, basktPrice]);

  const hasPositions = useMemo(() => {
    return positions.length > 0;
  }, [positions]);

  return {
    processedPositions,
    hasPositions,
    totalPositions: positions.length,
  };
}
