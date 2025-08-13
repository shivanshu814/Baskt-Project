import { useMemo } from 'react';
import {
  formatCloseAmount,
  formatPositionType,
  getPositionTypeColor,
} from '../../../utils/formatters/formatters';

export function usePositionInfo(position: any, closeAmount: string | number) {
  const positionType = useMemo(() => {
    return formatPositionType(position?.isLong || false);
  }, [position?.isLong]);

  const positionTypeColor = useMemo(() => {
    return getPositionTypeColor(position?.isLong || false);
  }, [position?.isLong]);

  const formattedCloseAmount = useMemo(() => {
    return formatCloseAmount(closeAmount);
  }, [closeAmount]);

  const positionValue = useMemo(() => {
    // Prefer backend-provided notional value if available
    const usdcSize = position?.usdcSize;
    if (usdcSize !== undefined && usdcSize !== null) {
      const numeric = Number(usdcSize);
      return isNaN(numeric) ? 0 : numeric;
    }

    // Fallback: size * entryPrice (entryPrice is 1e6 scaled)
    const size = Number(position?.size || 0);
    const entryPrice = Number(position?.entryPrice || 0);
    if (size > 0 && entryPrice > 0) {
      return size * entryPrice * 1e6;
    }
    return 0;
  }, [position?.usdcSize, position?.size, position?.entryPrice]);

  return {
    positionType,
    positionTypeColor,
    formattedCloseAmount,
    positionValue,
    positionSize: position?.size || 0,
  };
}
