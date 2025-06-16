import { memo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SortOption, SORT_OPTIONS } from '@baskt/ui';
import { FilterControlsProps } from '../../types/baskt';

export const FilterControls = memo(({ sortBy, setSortBy }: FilterControlsProps) => (
  <div className="flex gap-2">
    <Select value={sortBy} onValueChange={setSortBy}>
      <SelectTrigger className="w-[150px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option: SortOption) => (
          <SelectItem key={option} value={option}>
            {option === 'popular'
              ? 'Most Popular'
              : option === 'newest'
                ? 'Newest'
                : 'Best Performance'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
));
