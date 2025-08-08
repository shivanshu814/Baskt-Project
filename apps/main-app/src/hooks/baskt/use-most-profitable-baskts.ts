import { BasktInfo } from '@baskt/types';
import { useMemo } from 'react';
import { trpc } from '../../lib/api/trpc';
import { processBasktData } from '../../utils/baskt/baskt';

export const useMostProfitableBaskts = () => {
  const { data: basktsData, isLoading } = trpc.baskt.getAllBaskts.useQuery(
    {
      withPerformance: true,
    },
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  );

  const mostProfitableBaskts = useMemo(() => {
    const processedBaskts = processBasktData(basktsData) as BasktInfo[];
    if (!processedBaskts.length) return [];

    const recentlyCreatedBaskts = processedBaskts.filter((baskt) => {
      return baskt.creationDate && baskt.creationDate > new Date(Date.now() - 24 * 60 * 60 * 1000);
    });

    const sortedByProfit = recentlyCreatedBaskts
      .sort((a, b) => {
        const aProfit = a.performance?.day || 0;
        const bProfit = b.performance?.day || 0;
        return bProfit - aProfit;
      })
      .slice(0, 4);

    return sortedByProfit;
  }, [basktsData]);

  return {
    mostProfitableBaskts,
    isLoading,
  };
};
