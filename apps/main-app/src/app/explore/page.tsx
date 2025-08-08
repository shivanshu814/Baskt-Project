'use client';

import { memo, useState } from 'react';
import { FilterControls } from '../../components/baskt/controls/FilterControls';
import { TabControls } from '../../components/baskt/controls/TabControls';
import { TrendingBanner } from '../../components/baskt/items/TrendingBanner';
import { ExploreHeader } from '../../components/baskt/layout/ExploreHeader';
import { TabContent } from '../../components/baskt/layout/TabContent';
import { BasktListSkeleton } from '../../components/baskt/skeleton/BasktListSkeleton';
import { SearchBar } from '../../components/shared/SearchBar';
import { useBasktList } from '../../hooks/baskt/use-baskt-list';

const ExplorePage = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'trending' | 'your'>('all');
  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filteredBaskts,
    popularBaskts,
    myBaskts,
    userAddress,
    isLoading,
  } = useBasktList();

  if (isLoading) {
    return <BasktListSkeleton />;
  }

  return (
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

          {/* tab controls */}
          <div className="w-full">
            <TabControls activeTab={activeTab} onTabChange={setActiveTab} />

            {/* tab content */}
            <TabContent
              activeTab={activeTab}
              filteredBaskts={filteredBaskts}
              popularBaskts={popularBaskts}
              myBaskts={myBaskts}
              userAddress={userAddress}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ExplorePage);
