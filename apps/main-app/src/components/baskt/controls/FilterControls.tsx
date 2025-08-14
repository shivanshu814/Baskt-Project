'use client';

import { Select, SelectContent, SelectItem, SelectTrigger } from '@baskt/ui';
import { BarChart3, Filter, TrendingDown, TrendingUp } from 'lucide-react';
import { memo } from 'react';
import { useFilterControls } from '../../../hooks/baskt/filter/use-filter-controls';
import { FilterControlsProps } from '../../../types/baskt';

export const FilterControls = memo(({ sortBy, setSortBy }: FilterControlsProps) => {
  const { isFilterApplied, handleFilterChange } = useFilterControls(sortBy, setSortBy);

  return (
    <div className="flex gap-2 w-full sm:w-auto">
      <Select value={sortBy} onValueChange={handleFilterChange}>
        <SelectTrigger className="w-full sm:w-[160px] bg-background border-border hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter</span>
            {isFilterApplied && <div className="w-2 h-2 bg-primary rounded-full ml-auto" />}
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="no_filter">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span>No Filter</span>
              </div>
            </div>
          </SelectItem>
          <SelectItem value="highest_24h_profit">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Highest 24h Profit</span>
              </div>
            </div>
          </SelectItem>
          <SelectItem value="lowest_24h_profit">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                <span>Lowest 24h Profit</span>
              </div>
            </div>
          </SelectItem>
          <SelectItem value="highest_volume">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Highest Volume</span>
              </div>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
});
