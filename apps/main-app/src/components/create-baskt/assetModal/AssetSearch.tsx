'use client';

import { Input } from '@baskt/ui';
import { Search } from 'lucide-react';
import { AssetSearchProps } from '../../../types/asset';

export const AssetSearch = ({
  searchQuery,
  setSearchQuery,
  isLoading,
  filteredAssetsCount,
}: AssetSearchProps) => (
  <div className="p-4 sm:p-6 border-b border-border/50">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        placeholder="Search assets..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10"
      />
    </div>
    <div className="text-sm text-muted-foreground mt-2">
      {isLoading ? 'Loading assets...' : `${filteredAssetsCount} assets found`}
    </div>
  </div>
);
