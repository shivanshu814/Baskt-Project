import { useCallback, useState } from 'react';
import { UseSearchProps, UseSearchReturn } from '../../types/components/ui/ui';

export const useSearch = ({
  initialValue = '',
  initialFilter = 'all',
  placeholder = 'Search baskets...',
  hideFilters = false,
}: UseSearchProps = {}): UseSearchReturn => {
  const [searchValue, setSearchValue] = useState(initialValue);
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);

  const clearSearch = useCallback(() => {
    setSearchValue('');
  }, []);

  const clearFilter = useCallback(() => {
    setSelectedFilter('all');
  }, []);

  const resetSearch = useCallback(() => {
    setSearchValue(initialValue);
    setSelectedFilter(initialFilter);
  }, [initialValue, initialFilter]);

  return {
    searchValue,
    selectedFilter,
    placeholder,
    hideFilters,
    setSearchValue,
    setSelectedFilter,
    clearSearch,
    clearFilter,
    resetSearch,
  };
};
