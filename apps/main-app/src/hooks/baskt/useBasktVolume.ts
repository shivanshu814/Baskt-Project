import { trpc } from '../../utils/trpc';

export const useBasktVolume = (basktId: string) => {
  const { data, isLoading, error } = trpc.metrics.getVolumeForBaskt.useQuery(
    {
      basktId,
    },
    {
      refetchInterval: 30 * 1000,
      enabled: !!basktId,
    },
  );

  return {
    volumeData: data?.success && 'data' in data ? data.data : null,
    isLoading,
    error,
    totalVolume: data?.success && 'data' in data ? data.data?.totalVolume || 0 : 0,
    longVolume: data?.success && 'data' in data ? data.data?.longVolume || 0 : 0,
    shortVolume: data?.success && 'data' in data ? data.data?.shortVolume || 0 : 0,
    totalPositions: data?.success && 'data' in data ? data.data?.totalPositions || 0 : 0,
  };
};
