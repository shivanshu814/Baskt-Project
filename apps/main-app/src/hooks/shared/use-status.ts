import { useMemo } from 'react';
import { StatusType } from '../../types/components/shared/status';
import {
  getStatusColor,
  getStatusDotColor,
  getStatusPulseColor,
} from '../../utils/validation/validation';
export const useStatus = (status: StatusType) => {
  const statusColors = useMemo(
    () => ({
      textColor: getStatusColor(status),
      dotColor: getStatusDotColor(status),
      pulseColor: getStatusPulseColor(status),
    }),
    [status],
  );

  return statusColors;
};
