'use client';

import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import { Button, Loading, Tabs, TabsList, TabsTrigger, TabsContent } from '@baskt/ui';
import { Footer } from '../../components/shared/Footer';
import { SearchBar } from '../../components/shared/SearchBar';
import { FilterControls } from '../../components/baskt/FilterControls';
import { BasktGrid } from '../../components/baskt/BasktGrid';
import { EmptyState } from '../../components/baskt/EmptyState';
import { useBasktList } from '../../hooks/baskt/useBasktList';

const Baskts = () => {
  const router = useRouter();
  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filteredBaskts,
    popularBaskts,
    isLoading,
  } = useBasktList();

  const handleCreateClick = () => router.push('/create-baskt');

  return (
    <div>
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col gap-6 sm:gap-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Explore Baskts</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Discover and trade curated crypto index products.
              </p>
            </div>
            <Button className="w-full sm:w-auto whitespace-nowrap" onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Create Baskt
            </Button>
          </div>

          {/* Search and Filter Section */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search baskts..."
            />
            <FilterControls sortBy={sortBy} setSortBy={setSortBy} />
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full sm:w-auto mb-4 sm:mb-6">
              <TabsTrigger value="all" className="flex-1 sm:flex-none">
                All Baskts
              </TabsTrigger>
              <TabsTrigger value="trending" className="flex-1 sm:flex-none">
                Trending
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
                  <Loading />
                </div>
              ) : filteredBaskts.length === 0 ? (
                <EmptyState onCreateClick={handleCreateClick} />
              ) : (
                <BasktGrid baskts={filteredBaskts} />
              )}
            </TabsContent>

            <TabsContent value="trending" className="mt-0">
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h2 className="text-lg sm:text-xl font-semibold">Trending Now</h2>
                </div>
                <BasktGrid baskts={popularBaskts} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default memo(Baskts);
