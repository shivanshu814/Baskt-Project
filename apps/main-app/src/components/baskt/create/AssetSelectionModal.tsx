'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Search } from 'lucide-react';
import { Loading } from '../../ui/loading';
import { useBasktClient } from '@baskt/ui';
import { toast } from 'sonner';
import { trpc } from '../../../utils/trpc';
import { AssetSelectionModalProps } from '../../../types/baskt';

export function AssetSelectionModal({
  open,
  onOpenChange,
  onAssetSelect,
}: AssetSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { client } = useBasktClient();
  const [assets, setAssets] = useState<any[]>([]); // eslint-disable-line
  const [isLoading, setIsLoading] = useState(true);
  const { data: assetsData, isSuccess: assetDataFetchSuccess } = trpc.asset.getAllAssets.useQuery();

  useEffect(() => {
    const fetchAssets = async () => {
      if (!client && !assetDataFetchSuccess) return;
      try {
        setIsLoading(true);
        const backendAssets = assetsData?.data ?? [];
        setAssets(backendAssets);
      } catch (error) {
        toast.error('Error fetching assets');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
  }, [client, assetDataFetchSuccess]);

  const filteredAssets = assets.filter(
    (asset) =>
      asset.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.assetAddress.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#0D0D1A] text-white rounded-2xl p-4">
        <DialogHeader>
          <DialogTitle>Select Asset</DialogTitle>
          <DialogDescription>
            Choose an asset to add to your Baskt. You can search by name or ticker.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1A1A2B] border border-[#2D2D3C] text-white placeholder:text-muted-foreground"
            />
          </div>
          {/* Asset list */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loading />
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No assets found</div>
            ) : (
              filteredAssets.map((asset) => (
                <div
                  key={asset.assetAddress}
                  onClick={() => {
                    onAssetSelect(asset);
                    setSearchQuery('');
                  }}
                  className="flex items-center justify-between py-3 px-2 hover:bg-[#1E1E2F] cursor-pointer transition rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <img src={asset.logo} alt={asset.ticker} className="h-8 w-8 rounded-full" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{asset.ticker}</span>
                      <span className="text-xs text-muted-foreground">{asset.name}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span>
                      {asset.price < 0.0001 ? asset.price.toFixed(8) : asset.price.toFixed(4)}
                    </span>
                    <span
                      className={
                        asset.change24h >= 0 ? 'text-success text-xs' : 'text-destructive text-xs'
                      }
                    >
                      {(asset.change24h / 1e9).toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
