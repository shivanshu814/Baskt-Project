'use client';

import { Layout } from '../../components/Layout';
import { MarketOverview } from '../../components/market/MarketOverview';
import { Button } from '../../components/src/button';
import { Input } from '../../components/src/input';
import { Search } from 'lucide-react';

export default function Markets() {
  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <h1 className="text-3xl font-bold tracking-tight">Markets</h1>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search markets..." className="pl-9" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-full">
            All
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            Spot
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            Futures
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            New Listings
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            Top Volume
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            Top Gainers
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            Top Losers
          </Button>
        </div>

        <MarketOverview />
      </div>
    </Layout>
  );
}
