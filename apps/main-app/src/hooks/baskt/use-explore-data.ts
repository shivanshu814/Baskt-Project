import { useBasktClient } from '@baskt/ui';
import { trpc } from '../../lib/api/trpc';

export const useOptimizedBasktList = (
  dataType:
    | 'baskts'
    | 'publicBaskts'
    | 'trendingBaskts'
    | 'yourBaskts'
    | 'combinedBaskts' = 'publicBaskts',
  includeCurrentWeights: boolean = true,
) => {
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();

  const { data: basktsData, isLoading } = trpc.baskt.getExplorePageBaskts.useQuery(
    {
      userAddress,
      withPerformance: true,
      dataType,
      includeCurrentWeights,
    },
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      enabled: (() => {
        switch (dataType) {
          case 'publicBaskts':
            return true;
          case 'trendingBaskts':
            return true;
          case 'yourBaskts':
            return !!userAddress;
          case 'combinedBaskts':
            return !!userAddress;
          default:
            return true;
        }
      })(),
    },
  );

  return {
    baskts: basktsData?.data || [],
    userAddress,
    isLoading,
    message: basktsData?.message || '',
  };
};

export const useYourBaskts = (includeCurrentWeights?: boolean) =>
  useOptimizedBasktList('yourBaskts', includeCurrentWeights);

export const useCombinedBaskts = (includeCurrentWeights?: boolean) =>
  useOptimizedBasktList('combinedBaskts', includeCurrentWeights);

export const usePublicBaskts = (includeCurrentWeights?: boolean) =>
  useOptimizedBasktList('publicBaskts', includeCurrentWeights);

export const useTrendingBaskts = (includeCurrentWeights?: boolean) =>
  useOptimizedBasktList('trendingBaskts', includeCurrentWeights);
