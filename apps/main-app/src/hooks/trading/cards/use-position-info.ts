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

  return {
    positionType,
    positionTypeColor,
    formattedCloseAmount,
    positionSize: position?.size || 0,
  };
}
