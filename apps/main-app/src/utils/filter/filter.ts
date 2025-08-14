import { SortOption } from '@baskt/ui';

export const isFilterApplied = (sortBy: SortOption): boolean => {
  return sortBy !== 'no_filter';
};

export const handleFilterChange = (
  value: string,
  sortBy: SortOption,
  setSortBy: (value: SortOption) => void,
): void => {
  if (value === sortBy) {
    setSortBy('no_filter');
  } else {
    setSortBy(value as SortOption);
  }
};
