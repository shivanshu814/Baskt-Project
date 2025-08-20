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
  isActive: boolean = false,
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
      enabled:
        isActive &&
        (() => {
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

export const useYourBaskts = (includeCurrentWeights?: boolean, isActive?: boolean) =>
  useOptimizedBasktList('yourBaskts', includeCurrentWeights, isActive);

export const useCombinedBaskts = (includeCurrentWeights?: boolean, isActive?: boolean) =>
  useOptimizedBasktList('combinedBaskts', includeCurrentWeights, isActive);

export const usePublicBaskts = (includeCurrentWeights?: boolean, isActive?: boolean) =>
  useOptimizedBasktList('publicBaskts', includeCurrentWeights, isActive);

export const useTrendingBaskts = (includeCurrentWeights?: boolean, isActive?: boolean) =>
  useOptimizedBasktList('trendingBaskts', includeCurrentWeights, isActive);
