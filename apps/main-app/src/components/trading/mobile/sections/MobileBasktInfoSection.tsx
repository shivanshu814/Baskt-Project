import { ChevronDown } from 'lucide-react';
import { useRef, useState } from 'react';
import { MobileBasktInfoSectionProps } from '../../../../types/trading/components/mobile';
import { BasktInfoExpanded } from '../../shared/baskt/BasktInfoExpanded';
import { MobileAssetDisplay } from './MobileAssetDisplay';

export function MobileBasktInfoSection({
  baskt,
  searchQuery,
  setSearchQuery,
  selectedFilter,
  setSelectedFilter,
  filteredBaskts,
  onBasktSelect,
}: MobileBasktInfoSectionProps) {
  const [isBasktInfoExpanded, setIsBasktInfoExpanded] = useState(false);
  const mobileBasktInfoRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="w-1/2 border border-border bg-zinc-900/80 mb-1 rounded-sm relative"
      ref={mobileBasktInfoRef}
    >
      <button
        onClick={() => setIsBasktInfoExpanded(!isBasktInfoExpanded)}
        className="w-full px-2 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MobileAssetDisplay assets={baskt.assets} />
          <span className="font-semibold text-sm">{baskt.name}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-white transition-transform duration-200 ${
            isBasktInfoExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isBasktInfoExpanded && (
        <BasktInfoExpanded
          baskt={baskt}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          filteredBaskts={filteredBaskts}
          onBasktSelect={onBasktSelect}
          onClose={() => setIsBasktInfoExpanded(false)}
        />
      )}
    </div>
  );
}
