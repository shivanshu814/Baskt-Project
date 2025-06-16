import { useMemo, useState } from 'react';
import { trpc } from '../../utils/trpc';
import { SortOption } from '@baskt/ui';
import { BasktInfo } from '@baskt/types';
import { processBasktData } from '../../utils/baskt/processBasktData';
import { filterBaskts } from '../../utils/baskt/filterBaskts';
import { sortBaskts } from '../../utils/baskt/sortBaskts';
import { useDebounce } from '../common/use-debounce';

export const useBasktList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: basktsData, isLoading } = trpc.baskt.getAllBaskts.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { filteredBaskts, popularBaskts } = useMemo(() => {
    const processedBaskts = processBasktData(basktsData) as BasktInfo[];
    if (!processedBaskts.length) return { filteredBaskts: [], popularBaskts: [] };

    const filtered = filterBaskts(processedBaskts, debouncedSearch);
    const sorted = sortBaskts(filtered, sortBy);

    return {
      filteredBaskts: sorted,
      popularBaskts: sorted.slice(0, 4),
    };
  }, [basktsData, debouncedSearch, sortBy]);

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filteredBaskts,
    popularBaskts,
    isLoading,
  };
};
