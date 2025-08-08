import { SortOption } from '@baskt/ui';
import React from 'react';

/**
 * Checks if a filter is applied.
 * @param sortBy - The current sort option.
 * @returns True if a filter is applied, false otherwise.
 */
export const isFilterApplied = (sortBy: SortOption): boolean => {
  return sortBy !== 'no_filter';
};

/**
 * Handles the filter change.
 * @param value - The new value to set.
 * @param sortBy - The current sort option.
 * @param setSortBy - The function to set the sort option.
 */
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

/**
 * Gets the filter indicator.
 * @param isFilterApplied - True if a filter is applied, false otherwise.
 * @returns The filter indicator.
 */
export const getFilterIndicator = (isFilterApplied: boolean): React.ReactElement | null => {
  return isFilterApplied
    ? React.createElement('div', { className: 'w-2 h-2 bg-primary rounded-full ml-auto' })
    : null;
}; 