'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search } from 'lucide-react';
import { AssetInfo } from '@baskt/types';
import { useBasktClient } from '@baskt/ui';
import { toast } from 'sonner';
import { trpc } from '../../utils/trpc';

interface AssetSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssetSelect: (asset: AssetInfo) => void;
}

export function AssetSelectionModal({
  open,
  onOpenChange,
  onAssetSelect,
}: AssetSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { client } = useBasktClient();
  const [assets, setAssets] = useState<any[]>([]);
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Assets</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No assets found</div>
            ) : (
              filteredAssets.map((asset) => (
                <Button
                  key={`select-${asset.ticker}-${asset.assetAddress}`}
                  variant="outline"
                  className="w-full flex items-center justify-between px-4 py-8"
                  onClick={() => onAssetSelect(asset)}
                >
                  <div className="flex items-center gap-3">
                    <img src={asset.logo} alt={asset.ticker} className="h-8 w-8 rounded-full" />
                    <div className="flex flex-col items-start">
                      <span>{asset.ticker}</span>
                      <span className="text-xs text-muted-foreground">{asset.name}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span>{asset.price}</span>
                    <span
                      className={
                        asset.change24h >= 0 ? 'text-success text-xs' : 'text-destructive text-xs'
                      }
                    >
                      {asset.change24h}%
                    </span>
                  </div>
                </Button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
