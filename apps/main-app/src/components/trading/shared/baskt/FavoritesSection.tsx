'use client';

import { ChevronDown, Star } from 'lucide-react';
import { useRef, useState } from 'react';
import { useBasktList } from '../../../../hooks/baskt/use-baskt-list';
import { FavoriteItem } from '../cards/FavoriteItem';

export function FavoritesSection() {
  const mobileFavoritesRef = useRef<HTMLDivElement>(null);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(false);
  const { filteredBaskts, isLoading: isLoadingBaskts } = useBasktList();

  return (
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
            {isLoadingBaskts ? (
              <div className="col-span-2 text-center text-sm text-muted-foreground py-2">
                Loading baskets...
              </div>
            ) : filteredBaskts.length > 0 ? (
              filteredBaskts.map((baskt, index) => (
                <FavoriteItem key={baskt.basktId || index} baskt={baskt} index={index} />
              ))
            ) : (
              <div className="col-span-2 text-center text-sm text-muted-foreground py-2">
                No profitable baskets found in last 24 hours
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
