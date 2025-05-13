'use client';

import { trpc } from '../../utils/trpc';
import { useRouter } from 'next/navigation';
import { Footer } from '../../components/Footer';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useDebounce } from '../../hooks/use-debounce';
import { Plus, Search, TrendingUp } from 'lucide-react';
import { BasktCard } from '../../components/baskt/BasktCard';
import { useMemo, useState, useCallback, memo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { BasktInfo, BasktAssetInfo, BasktPageState } from '@baskt/types';
import { Category, SortOption, CATEGORIES, SORT_OPTIONS } from '@baskt/ui/types/constants';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';

const SearchBar = memo(
  ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <div className="relative flex-grow">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        placeholder="Search baskts..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  ),
);

const FilterControls = memo(
  ({
    category,
    setCategory,
    sortBy,
    setSortBy,
  }: {
    category: Category;
    setCategory: (value: Category) => void;
    sortBy: SortOption;
    setSortBy: (value: SortOption) => void;
  }) => (
    <div className="grid grid-cols-2 gap-4 md:flex md:gap-2">
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="w-full md:w-[150px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((cat: Category) => (
            <SelectItem key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-full md:w-[150px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option: SortOption) => (
            <SelectItem key={option} value={option}>
              {option === 'popular'
                ? 'Most Popular'
                : option === 'newest'
                  ? 'Newest'
                  : 'Best Performance'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ),
);

const BasktGrid = memo(({ baskts }: { baskts: BasktInfo[] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {baskts.map((baskt) => (
      <BasktCard
        key={baskt.basktId.toString()}
        baskt={baskt}
        className="hover:shadow-md transition-shadow"
      />
    ))}
  </div>
));

const EmptyState = memo(({ onCreateClick }: { onCreateClick: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 bg-secondary/20 rounded-lg shadow-md border border-border">
    <div className="mb-6">
      <Search className="w-16 h-16 text-muted-foreground" />
    </div>
    <h3 className="text-2xl font-semibold mb-2">No baskts found</h3>
    <p className="text-muted-foreground mb-6 max-w-md text-center">
      We couldn't find any baskts matching your search. Try different keywords or create your own!
    </p>
    <Button onClick={onCreateClick} size="lg">
      <Plus className="mr-2 h-5 w-5" />
      Create Your Own Baskt
    </Button>
  </div>
));

const Baskts = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: basktsData, isLoading } = trpc.baskt.getAllBaskts.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const processBaskts = useCallback((data: typeof basktsData): BasktInfo[] => {
    if (!data?.success || !('data' in data)) return [];

    return data.data
      .filter(
        (baskt): baskt is NonNullable<typeof baskt> =>
          baskt !== null && 'basktId' in baskt && 'account' in baskt,
      )
      .map((baskt) => ({
        ...baskt,
        creationDate: new Date(baskt.creationDate),
        performance: {
          day: baskt.performance.daily,
          week: baskt.performance.weekly,
          month: baskt.performance.monthly,
          year: baskt.performance.year,
        },
        assets: baskt.assets.map(
          (asset): BasktAssetInfo => ({
            ...asset,
            weight: Number(asset.weight),
            direction: asset.direction,
            id: asset.id,
            name: asset.name,
            ticker: asset.ticker || '',
            price: asset.price,
            change24h: asset.change24h,
            volume24h: asset.volume24h,
            marketCap: asset.marketCap,
            assetAddress: asset.assetAddress || '',
            logo: asset.logo,
          }),
        ),
        category: baskt.categories || [],
      })) as BasktInfo[];
  }, []);

  const { filteredBaskts, popularBaskts, categoryBaskts } = useMemo<BasktPageState>(() => {
    const processedBaskts = processBaskts(basktsData);
    if (!processedBaskts.length)
      return { filteredBaskts: [], popularBaskts: [], categoryBaskts: {} };

    let filtered = processedBaskts;

    if (category !== 'all') {
      filtered = filtered.filter((baskt) => baskt.categories?.includes(category));
    }

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (baskt) =>
          baskt?.name?.toLowerCase().includes(searchLower) ||
          baskt?.description?.toLowerCase().includes(searchLower) ||
          baskt?.categories?.some((cat) => cat.toLowerCase().includes(searchLower)),
      );
    }

    const sortedBaskts = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.aum - a.aum;
        case 'newest':
          return b.creationDate.getTime() - a.creationDate.getTime();
        case 'performance':
          return b.change24h - a.change24h;
        default:
          return 0;
      }
    });

    const groupedByCategory = sortedBaskts.reduce<Record<string, BasktInfo[]>>((acc, baskt) => {
      const primaryCategory = baskt?.categories?.[0] || 'uncategorized';
      if (!acc[primaryCategory]) acc[primaryCategory] = [];
      acc[primaryCategory].push(baskt);
      return acc;
    }, {});

    return {
      filteredBaskts: sortedBaskts,
      popularBaskts: sortedBaskts.slice(0, 4),
      categoryBaskts: groupedByCategory,
    };
  }, [basktsData, category, debouncedSearch, sortBy, processBaskts]);

  const handleCreateClick = useCallback(() => router.push('/create-baskt'), [router]);

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
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <FilterControls
              category={category}
              setCategory={setCategory}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
          </div>

          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Baskts</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {isLoading ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">Loading baskts...</p>
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

            <TabsContent value="categories">
              <div className="space-y-10">
                {Object.entries(categoryBaskts).map(([category, baskts]) => (
                  <div key={category} className="mb-6">
                    <h2 className="text-xl font-semibold mb-4 capitalize">{category}</h2>
                    <BasktGrid baskts={baskts} />
                  </div>
                ))}
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
