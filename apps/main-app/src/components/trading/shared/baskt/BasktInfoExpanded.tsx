import { BasktInfoExpandedProps } from '../../../../types/baskt';
import { BasketSearchBar } from '../../../shared/BasketSearchBar';
import { BasktList } from './BasktList';

export function BasktInfoExpanded({
  baskt,
  searchQuery,
  setSearchQuery,
  selectedFilter,
  setSelectedFilter,
  filteredBaskts,
  onBasktSelect,
  onClose,
}: BasktInfoExpandedProps) {
  return (
    <div className="absolute top-full left-0 z-50 mt-1 bg-zinc-900/95 w-[26rem] border border-border rounded-lg shadow-lg backdrop-blur-sm w-screen max-w-md">
      <div className="p-4 w-full pr-10">
        <div className="pb-2 w-full">
          <BasketSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            placeholder="Search baskets..."
            hideFilters={true}
          />
        </div>

        <div className="space-y-2">
          <BasktList
            filteredBaskts={filteredBaskts}
            currentBasktId={baskt?.basktId}
            searchQuery={searchQuery}
            onBasktSelect={onBasktSelect}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
