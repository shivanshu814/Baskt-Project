import { trpc } from '../../utils/trpc';
import { PositionStatus } from '@baskt/types';

export const useBasktOI = (basktId: string) => {
  const { data, isLoading, error } = trpc.metrics.getOpenInterestForBaskt.useQuery(
    {
      basktId,
      positionStatus: PositionStatus.OPEN,
    },
    {
      refetchInterval: 30 * 1000,
      enabled: !!basktId,
    },
  );

  return {
    oiData: data?.success && 'data' in data ? data.data : null,
    isLoading,
    error,
    totalOpenInterest: data?.success && 'data' in data ? data.data?.totalOpenInterest || 0 : 0,
    longOpenInterest: data?.success && 'data' in data ? data.data?.longOpenInterest || 0 : 0,
    shortOpenInterest: data?.success && 'data' in data ? data.data?.shortOpenInterest || 0 : 0,
    totalPositions: data?.success && 'data' in data ? data.data?.totalPositions || 0 : 0,
  };
};
