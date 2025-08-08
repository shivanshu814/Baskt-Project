import { SortOption } from '@baskt/ui';
import { useCallback } from 'react';

export const useFilterControls = (sortBy: SortOption, setSortBy: (value: SortOption) => void) => {
  const isFilterApplied = useCallback(() => {
    return sortBy !== 'no_filter';
  }, [sortBy]);

  const handleFilterChange = useCallback(
    (value: string) => {
      if (value === sortBy) {
        setSortBy('no_filter');
      } else {
        setSortBy(value as SortOption);
      }
    },
    [sortBy, setSortBy],
  );

  return {
    isFilterApplied: isFilterApplied(),
    handleFilterChange,
  };
};
