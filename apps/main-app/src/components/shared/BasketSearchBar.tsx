import { Button, Input } from '@baskt/ui';
import { Search } from 'lucide-react';
import { forwardRef } from 'react';
import { BasketSearchBarProps } from '../../types/components/ui/ui';
import { createSearchBarProps } from '../../utils/search/search';

export const BasketSearchBar = forwardRef<HTMLDivElement, BasketSearchBarProps>((props, ref) => {
  const { searchInputProps, filterButtonsProps, containerProps } = createSearchBarProps(props);

  return (
    <div ref={ref} className={containerProps.className}>
      <div className="relative w-2/5">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="text" {...searchInputProps} />
      </div>
      {!filterButtonsProps.hideFilters && (
        <div className="flex gap-2 flex-wrap">
          {filterButtonsProps.filters.map((filter: { label: string; value: string }) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={filterButtonsProps.selectedFilter === filter.value ? 'default' : 'outline'}
              className={filterButtonsProps.getButtonClasses(
                filterButtonsProps.selectedFilter === filter.value,
              )}
              onClick={() => filterButtonsProps.onFilterChange(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
});

BasketSearchBar.displayName = 'BasketSearchBar';
