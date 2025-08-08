import { BasktInfo } from '@baskt/types';
import { SortOption, useBasktClient } from '@baskt/ui';
import { useMemo, useState } from 'react';
import { trpc } from '../../lib/api/trpc';
import { processBasktData } from '../../utils/baskt/baskt';

export const useBasktList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('no_filter');
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();

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

  const { filteredBaskts, popularBaskts, myBaskts } = useMemo(() => {
    const processedBaskts = processBasktData(basktsData) as BasktInfo[];
    if (!processedBaskts.length) return { filteredBaskts: [], popularBaskts: [], myBaskts: [] };

    const filtered = searchQuery
      ? processedBaskts.filter(
          (baskt) =>
            baskt.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            baskt.assets?.some(
              (asset) =>
                asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                asset.ticker?.toLowerCase().includes(searchQuery.toLowerCase()),
            ),
        )
      : processedBaskts;

    const myBaskts = userAddress
      ? processedBaskts.filter(
          (baskt) => baskt.creator && baskt.creator.toLowerCase() === userAddress.toLowerCase(),
        )
      : [];

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const trendingBaskts = processedBaskts.filter((baskt) => {
      const isProfitable = (baskt.performance?.day || 0) >= 0;

      const isNew = baskt.creationDate && baskt.creationDate > tenDaysAgo;

      return isProfitable && isNew;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'no_filter':
          return 0;
        case 'highest_24h_profit':
          const aProfit = a.performance?.day || 0;
          const bProfit = b.performance?.day || 0;
          return bProfit - aProfit;
        case 'lowest_24h_profit':
          const aLeastProfit = a.performance?.day || 0;
          const bLeastProfit = b.performance?.day || 0;
          return aLeastProfit - bLeastProfit;
        case 'highest_volume':
          const aVolume = a.aum || 0;
          const bVolume = b.aum || 0;
          return bVolume - aVolume;
        default:
          return 0;
      }
    });

    return {
      filteredBaskts: sorted,
      popularBaskts: trendingBaskts.slice(0, 4),
      myBaskts,
    };
  }, [basktsData, searchQuery, sortBy, userAddress]);

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filteredBaskts,
    popularBaskts,
    myBaskts,
    userAddress,
    isLoading,
  };
};
