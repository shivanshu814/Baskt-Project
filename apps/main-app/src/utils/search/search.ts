import { SearchBarComponentProps, SearchBarProps } from '../../types/baskt/ui/ui';

export const getFilterButtonClasses = (isSelected: boolean): string => {
  const baseClasses = 'rounded-full px-4 py-1 text-xs font-medium border-border transition-colors';
  const stateClasses = isSelected
    ? 'bg-primary text-white'
    : 'bg-zinc-800 text-muted-foreground hover:bg-zinc-700';

  return `${baseClasses} ${stateClasses}`;
};

export const createSearchBarProps = ({
  value,
  onChange,
  selectedFilter,
  onFilterChange,
  placeholder = 'Search baskts...',
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
