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
      <div className="container mx-auto py-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Explore Baskts</h1>
              <p className="text-muted-foreground">
                Discover and trade curated crypto index products.
              </p>
            </div>
            <Button className="whitespace-nowrap" onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Create Baskt
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search baskts..."
            />
            <FilterControls sortBy={sortBy} setSortBy={setSortBy} />
          </div>

          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Baskts</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <Loading />
                </div>
              ) : filteredBaskts.length === 0 ? (
                <EmptyState onCreateClick={handleCreateClick} />
              ) : (
                <BasktGrid baskts={filteredBaskts} />
              )}
            </TabsContent>

            <TabsContent value="trending">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Trending Now</h2>
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
