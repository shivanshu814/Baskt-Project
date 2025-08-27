import { useBasktClient } from '@baskt/ui';
import { trpc } from '../../lib/api/trpc';

export const useOptimizedBasktList = (
  dataType: 'yourBaskts' | 'all' = 'all',
  isActive: boolean = false,
) => {
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();

  const { data: basktsData, isLoading } = trpc.baskt.getExplorePageBaskts.useQuery(
    {
      userAddress,
      dataType,
    },
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      enabled: isActive,
    },
  );

  return {
    baskts: basktsData?.data || {
      publicBaskts: [],
      yourBaskts: [],
      combinedBaskts: [],
      trendingBaskts: [],
    },
    userAddress,
    isLoading,
  };
};

export const useYourBaskts = (isActive?: boolean) => useOptimizedBasktList('yourBaskts', isActive);
