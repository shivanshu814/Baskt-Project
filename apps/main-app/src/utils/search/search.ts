import { SearchBarComponentProps, SearchBarProps } from '../../types/components/ui/ui';

/**
 * Get filter button classes based on selection state
 */
export const getFilterButtonClasses = (isSelected: boolean): string => {
  const baseClasses = 'rounded-full px-4 py-1 text-xs font-medium border-border transition-colors';
  const stateClasses = isSelected
    ? 'bg-primary text-white'
    : 'bg-zinc-800 text-muted-foreground hover:bg-zinc-700';

  return `${baseClasses} ${stateClasses}`;
};

/**
 * Filter items based on search value and selected filter
 */
export const filterItems = <T extends Record<string, any>>(
  items: T[],
  searchValue: string,
  selectedFilter: string,
  searchFields: (keyof T)[],
  filterField?: keyof T,
): T[] => {
  return items.filter((item) => {
    // Filter by selected filter
    if (selectedFilter !== 'all' && filterField) {
      const itemFilter = item[filterField];
      if (itemFilter !== selectedFilter) {
        return false;
      }
    }

    // Filter by search value
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase();
      const hasMatch = searchFields.some((field) => {
        const fieldValue = item[field];
        return fieldValue && fieldValue.toString().toLowerCase().includes(searchLower);
      });
      return hasMatch;
    }

    return true;
  });
};

/**
 * Get search statistics
 */
export const getSearchStats = <T>(
  items: T[],
  filteredItems: T[],
  searchValue: string,
  selectedFilter: string,
) => {
  return {
    totalItems: items.length,
    filteredItems: filteredItems.length,
    hasSearchValue: !!searchValue.trim(),
    hasFilterSelected: selectedFilter !== 'all',
    isFiltered: searchValue.trim() || selectedFilter !== 'all',
  };
};

/**
 * Get available filters based on items
 */
export const getAvailableFilters = <T>(
  items: T[],
  filterField: keyof T,
): Array<{ label: string; value: string }> => {
  const availableValues = new Set(items.map((item) => item[filterField]).filter(Boolean));

  const searchFilters = [
    { label: 'All', value: 'all' },
    { label: 'DeFi', value: 'defi' },
    { label: 'Layer 1', value: 'layer1' },
    { label: 'Layer 2', value: 'layer2' },
    { label: 'Gaming', value: 'gaming' },
    { label: 'Meme', value: 'meme' },
  ];

  return searchFilters.filter(
    (filter) => filter.value === 'all' || availableValues.has(filter.value as any),
  );
};

/**
 * Create props for search bar components
 */
export const createSearchBarProps = ({
  value,
  onChange,
  selectedFilter,
  onFilterChange,
  placeholder = 'Search baskets...',
  hideFilters = false,
}: SearchBarProps): SearchBarComponentProps => {
  return {
    searchInputProps: {
      value,
      onChange: (e) => onChange(e.target.value),
      placeholder,
      className:
        'pl-10 bg-zinc-900/80 border border-border rounded-xl focus:ring-0 text-base placeholder:text-muted-foreground',
    },
    filterButtonsProps: {
      filters: [
        { label: 'All', value: 'all' },
        { label: 'DeFi', value: 'defi' },
        { label: 'Layer 1', value: 'layer1' },
        { label: 'Layer 2', value: 'layer2' },
        { label: 'Gaming', value: 'gaming' },
        { label: 'Meme', value: 'meme' },
      ],
      selectedFilter,
      onFilterChange,
      getButtonClasses: getFilterButtonClasses,
      hideFilters,
    },
    containerProps: {
      className: 'flex items-center gap-4',
    },
  };
};
