'use client';

import { SortOption, useBasktClient } from '@baskt/ui';
import { memo, useMemo, useState } from 'react';
import { FilterControls } from '../../components/baskt/controls/FilterControls';
import { TabControls } from '../../components/baskt/controls/TabControls';
import { TrendingBanner } from '../../components/baskt/items/TrendingBanner';
import { ExploreHeader } from '../../components/baskt/layout/ExploreHeader';
import { TabContent } from '../../components/baskt/layout/TabContent';
import { BasktListSkeleton } from '../../components/baskt/skeleton/BasktListSkeleton';
import { SearchBar } from '../../components/shared/SearchBar';
import {
  useCombinedBaskts,
  usePublicBaskts,
  useTrendingBaskts,
  useYourBaskts,
} from '../../hooks/baskt/use-explore-data';
import { TabType } from '../../types/baskt';

const ExplorePage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('no_filter');

  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();

  const { baskts: publicBaskts, isLoading: isPublicLoading } = usePublicBaskts(
    true,
    activeTab === 'all' && !userAddress,
  );
  const { baskts: trendingBaskts, isLoading: isTrendingLoading } = useTrendingBaskts(
    true,
    activeTab === 'trending',
  );
  const { baskts: yourBaskts, isLoading: isYourLoading } = useYourBaskts(
    true,
    activeTab === 'your' && !!userAddress,
  );
  const { baskts: combinedBaskts, isLoading: isCombinedLoading } = useCombinedBaskts(
    true,
    activeTab === 'all' && !!userAddress,
  );

  const isLoading =
    (activeTab === 'all' && !userAddress && isPublicLoading) ||
    (activeTab === 'all' && userAddress && isCombinedLoading) ||
    (activeTab === 'trending' && isTrendingLoading) ||
    (activeTab === 'your' && userAddress && isYourLoading);

  const filteredBaskts = useMemo(() => {
    if (isLoading) return [];
    const q = searchQuery.trim().toLowerCase();

    let source;
    if (!userAddress) {
      source = publicBaskts;
    } else {
      source = activeTab === 'your' ? yourBaskts : combinedBaskts;
    }

    if (!q) return source;

    return source.filter(
      (b: any) =>
        b.baskt.name?.toLowerCase().includes(q) ||
        b.baskt.basktId?.toLowerCase().includes(q) ||
        b.assets?.some((a: any) => a.ticker?.toLowerCase().includes(q)),
    );
  }, [activeTab, searchQuery, combinedBaskts, yourBaskts, publicBaskts, userAddress, isLoading]);

  return isLoading ? (
    <BasktListSkeleton />
  ) : (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <TrendingBanner onReviewClick={() => setActiveTab('trending')} />
        <div className="flex flex-col gap-6 sm:gap-6">
          <ExploreHeader />

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <SearchBar
              value={searchQuery}
              selectedFilter={''}
              onFilterChange={() => {}}
              onChange={setSearchQuery}
              placeholder="Search baskts..."
            />
            <FilterControls sortBy={sortBy} setSortBy={setSortBy} />
          </div>

          <div className="w-full">
            <TabControls activeTab={activeTab} onTabChange={setActiveTab} />
            <TabContent
              activeTab={activeTab}
              filteredBaskts={filteredBaskts}
              trendingBaskts={trendingBaskts}
              publicBaskts={publicBaskts}
              yourBaskts={yourBaskts}
              userAddress={userAddress}
              isLoading={isTrendingLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ExplorePage);
