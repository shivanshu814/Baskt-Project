'use client';

import { ChevronDown, Sparkles, Star } from 'lucide-react';
import { useRef, useState } from 'react';
import { FavoritesSectionProps } from '../../../types/baskt';
import { calculatePerformanceColor, formatPriceChange } from '../../../utils/formatters/formatters';

export function FavoritesSection({ trendingBaskts, isLoading = false }: FavoritesSectionProps) {
  const mobileFavoritesRef = useRef<HTMLDivElement>(null);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(false);
  const safeFilteredBaskts = trendingBaskts || [];

  return (
    <div>
      {/* desktop mode */}
      <div className="hidden sm:block border border-border bg-zinc-900/80 rounded-sm">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="hidden lg:flex items-center gap-2 lg:gap-4">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <div className="flex items-center gap-4 overflow-x-auto">
              {isLoading ? (
                <span className="text-sm text-muted-foreground whitespace-nowrap">Loading...</span>
              ) : safeFilteredBaskts.length > 0 ? (
                safeFilteredBaskts.slice(0, 5).map((basktData, index) => {
                  const profit = basktData.metrics?.performance?.daily || 0;
                  const profitColor = calculatePerformanceColor(profit);
                  const profitText = formatPriceChange(profit);

                  return (
                    <span
                      key={basktData.baskt.basktId || index}
                      className="text-sm whitespace-nowrap"
                    >
                      {basktData.baskt.name} <span className={profitColor}>{profitText}</span>
                    </span>
                  );
                })
              ) : (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  No profitable baskts
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* mobile mode */}
      <div
        className="lg:hidden border border-border bg-zinc-900/80 rounded-sm"
        ref={mobileFavoritesRef}
      >
        <button
          onClick={() => setIsFavoritesExpanded(!isFavoritesExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-500 font-medium">Favorites</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-white transition-transform duration-200 ${
              isFavoritesExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isFavoritesExpanded && (
          <div className="px-4 pb-3 border-t border-border/50">
            <div className="grid grid-cols-2 gap-4 pt-3">
              {isLoading ? (
                <div className="col-span-2 text-center text-sm text-muted-foreground py-2">
                  Loading baskts...
                </div>
              ) : safeFilteredBaskts.length > 0 ? (
                safeFilteredBaskts.slice(0, 5).map((basktData, index) => {
                  const profit = basktData.metrics?.performance?.daily || 0;
                  const profitColor = calculatePerformanceColor(profit);
                  const profitText = formatPriceChange(profit);

                  return (
                    <div key={basktData.baskt.basktId || index} className="text-sm">
                      <span className="text-muted-foreground">{basktData.baskt.name}</span>
                      <div className={profitColor}>{profitText}</div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center text-sm text-muted-foreground py-2">
                  No profitable baskts found in last 24 hours
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
