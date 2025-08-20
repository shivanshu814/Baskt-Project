import { BasktInfo } from '@baskt/types';
import { NumberFormat } from '@baskt/ui';
import { ChevronDown } from 'lucide-react';
import { useRef, useState } from 'react';
import { MobileBasktInfoSectionProps } from '../../../types/baskt/trading/components/mobile';
import { getAssetDisplayInfo } from '../../../utils/asset/asset';
import { AssetLogo } from '../../create-baskt/assetModal/AssetLogo';
import { BasketSearchBar } from '../../shared/BasketSearchBar';
import { BasketAssetsDisplay } from '../shared/baskt/BasketAssetsDisplay';

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
  const { visibleAssets, extraCount, hasExtraAssets } = getAssetDisplayInfo(baskt.assets);
  const filterBaskts = (
    filteredBaskts: BasktInfo[],
    currentBasktId?: string,
    searchQuery?: string,
    maxResults: number = 8,
  ) => {
    return filteredBaskts
      ?.filter((basktItem) => basktItem.basktId !== currentBasktId)
      ?.filter((basktItem) => {
        if (!searchQuery) return true;
        return basktItem.name?.toLowerCase().includes(searchQuery.toLowerCase());
      })
      ?.slice(0, maxResults);
  };
  const filteredResults = filterBaskts(filteredBaskts, baskt?.basktId, searchQuery);

  if (searchQuery && filteredResults?.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-muted-foreground text-sm font-medium">No results found</div>
          <div className="text-muted-foreground text-xs mt-1">
            Try searching with different keywords
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex -space-x-1">
            {visibleAssets.map((asset, index) => (
              <div
                key={index}
                className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center"
              >
                <AssetLogo
                  ticker={asset.ticker || asset.name || 'Asset'}
                  logo={asset.logo || ''}
                  size="sm"
                />
              </div>
            ))}
            {hasExtraAssets && (
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">+{extraCount}</span>
              </div>
            )}
          </div>
          <span className="font-semibold text-sm">{baskt.name}</span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-white transition-transform duration-200 ${
            isBasktInfoExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isBasktInfoExpanded && (
        <div className="absolute top-full  left-0 z-50 mt-1 bg-zinc-900/95 w-[26.2rem] border border-border rounded-lg shadow-lg backdrop-blur-sm w-screen max-w-md">
          <div className="p-4 w-full pr-3">
            <div className="pb-2 w-full">
              <BasketSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                selectedFilter={selectedFilter}
                onFilterChange={setSelectedFilter}
                placeholder="Search baskts..."
                hideFilters={true}
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredResults?.map((basktItem, index) => {
                const performance = basktItem.performance?.day || 0;
                const isPositive = performance >= 0;

                return (
                  <div
                    key={basktItem.basktId || index}
                    className="flex items-center justify-between p-2 bg-zinc-800/50 rounded border border-border/50 hover:bg-zinc-700/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setIsBasktInfoExpanded(false);
                      onBasktSelect(basktItem.basktId);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <BasketAssetsDisplay assets={basktItem.assets || []} />
                      <div>
                        <div className="font-medium text-xs">{basktItem.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          <NumberFormat
                            value={
                              (basktItem as any).currentNav || (basktItem as any).baselineNav || 0
                            }
                            isPrice={true}
                            showCurrency={true}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xs font-medium ${
                          isPositive ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {performance.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
