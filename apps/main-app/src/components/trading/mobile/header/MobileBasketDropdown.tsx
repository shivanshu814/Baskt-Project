import { ChevronDown } from 'lucide-react';
import { useRef, useState } from 'react';
import { MobileBasketDropdownProps } from '../../../../types/trading/components/mobile';
import { BasketSearchBar } from '../../../shared/BasketSearchBar';
import { BasketAssetsDisplay } from '../../shared/baskt/BasketAssetsDisplay';
import { MobileBasketList } from './MobileBasketList';

export function MobileBasketDropdown({
  baskt,
  searchQuery,
  setSearchQuery,
  selectedFilter,
  setSelectedFilter,
  filteredBaskts,
  onBasktSelect,
}: MobileBasketDropdownProps) {
  const [isBasketDropdownOpen, setIsBasketDropdownOpen] = useState(false);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative" ref={mobileDropdownRef}>
      <button
        onClick={() => setIsBasketDropdownOpen(!isBasketDropdownOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <BasketAssetsDisplay assets={baskt.assets || []} />
          <div className="flex items-center gap-2">
            <span className="font-semibold">{baskt.name}</span>
            <BasketAssetsDisplay assets={baskt.assets || []} />
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-white transition-transform duration-200 ${
            isBasketDropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isBasketDropdownOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-zinc-900/95 border border-border rounded-sm shadow-lg backdrop-blur-sm w-full">
          <div className="p-4">
            <BasketSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
              placeholder="Search baskets..."
            />

            <MobileBasketList
              baskt={baskt}
              filteredBaskts={filteredBaskts}
              searchQuery={searchQuery}
              onBasktSelect={onBasktSelect}
            />
          </div>
        </div>
      )}
    </div>
  );
}
