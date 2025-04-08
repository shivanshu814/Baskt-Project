'use client';

import { Layout } from '../../components/Layout';
import { Button } from '../../components/src/button';
import { Input } from '../../components/src/input';
import { Grid2X2, Search, SlidersHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/src/table';
import { cn } from '../../lib/utils';
import { TrendingBaskts } from '../../components/baskt/TrendingBaskts';
import Link from 'next/link';
import { Baskt } from '../../types/baskt';

export default function Baskts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [baskts, setBaskts] = useState<Baskt[]>([]);
  const [isLoading, setIsLoading] = useState(true); //eslint-disable-line

  useEffect(() => {
    const fetchBaskts = async () => {
      try {
        // TODO: Replace with actual API call to fetch baskts
        // const response = await fetch('/api/baskts');
        // const data = await response.json();
        // setBaskts(data);
        setBaskts([]); // Empty array for now
      } catch (error) {
        console.error('Error fetching baskts:', error); //eslint-disable-line
        setBaskts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBaskts();
  }, []);

  const filteredBaskts = baskts.filter((baskt) => {
    const matchesSearch =
      baskt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      baskt.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      baskt.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeFilter === 'All' ||
      baskt.category.toLowerCase() === activeFilter.toLowerCase() ||
      baskt.risk.toLowerCase() === activeFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col items-center justify-center gap-6 mb-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-center">Baskts</h1>
          <p className="text-muted-foreground text-center max-w-2xl">
            Trade Baskts as a whole bundle - a diversified collection of assets that can be taken
            long or short with collateral.
          </p>
          <div className="flex items-center gap-2 w-full max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search baskts..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="sr-only">Filter</span>
            </Button>
          </div>
        </div>

        {/* Trending Baskts Section */}
        <TrendingBaskts />

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <Button
            variant={activeFilter === 'All' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => handleFilterClick('All')}
          >
            All
          </Button>
          <Button
            variant={activeFilter === 'AI' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => handleFilterClick('AI')}
          >
            AI
          </Button>
          <Button
            variant={activeFilter === 'DeFi' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => handleFilterClick('DeFi')}
          >
            DeFi
          </Button>
          <Button
            variant={activeFilter === 'Memecoins' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => handleFilterClick('Memecoins')}
          >
            Memecoins
          </Button>
          <Button
            variant={activeFilter === 'Astro' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => handleFilterClick('Astro')}
          >
            Astro
          </Button>
          <Button
            variant={activeFilter === 'low' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => handleFilterClick('low')}
          >
            Low Risk
          </Button>
          <Button
            variant={activeFilter === 'high' ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => handleFilterClick('high')}
          >
            High Risk
          </Button>
        </div>

        {/* All Baskts Section - No longer collapsible */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Grid2X2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">All Baskts</h2>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Baskt</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>24h Change</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>AUM</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBaskts.map((baskt) => (
                  <TableRow key={baskt.id}>
                    <TableCell className="font-medium">
                      <Link href={`/baskts/${baskt.id}`} className="hover:text-primary">
                        {baskt.name}
                      </Link>
                    </TableCell>
                    <TableCell>${baskt.price.toLocaleString()}</TableCell>
                    <TableCell
                      className={cn(baskt.change24h >= 0 ? 'text-success' : 'text-destructive')}
                    >
                      {baskt.change24h >= 0 ? '+' : ''}
                      {baskt.change24h.toFixed(2)}%
                    </TableCell>
                    <TableCell>{baskt.category}</TableCell>
                    <TableCell className="capitalize">{baskt.risk}</TableCell>
                    <TableCell>${(baskt.aum / 1000000).toFixed(1)}M</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/baskts/${baskt.id}`}>Trade</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {filteredBaskts.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <Grid2X2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium">No Baskts Found</h3>
            <p className="text-muted-foreground mt-2">
              We couldn't find any Baskts matching your search criteria.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
