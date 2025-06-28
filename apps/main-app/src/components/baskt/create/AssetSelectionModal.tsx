'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Loading,
  NumberFormat,
  useBasktClient,
  Button,
} from '@baskt/ui';
import { Search, X } from 'lucide-react';
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
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] w-full p-0 rounded-2xl overflow-hidden">
        <div className="flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="p-4 sm:p-6 border-b flex-shrink-0">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <DialogTitle className="text-lg sm:text-xl">Select Asset</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Choose an asset to add to your Baskt. You can search by name or ticker.
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 ml-2"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex flex-col space-y-4 p-4 sm:p-6 flex-1 min-h-0">
            {/* Search bar */}
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-4 py-2 rounded-xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
              />
            </div>

            {/* Asset list */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loading />
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery ? 'No assets found matching your search' : 'No assets available'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredAssets.map((asset) => (
                    <div
                      key={asset.assetAddress}
                      onClick={() => {
                        onAssetSelect(asset);
                        setSearchQuery('');
                      }}
                      className="flex items-center justify-between py-3 px-3 hover:bg-foreground/5 cursor-pointer transition rounded-md border border-transparent hover:border-border"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={asset.logo}
                          alt={asset.ticker}
                          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm sm:text-base font-semibold truncate">
                            {asset.ticker}
                          </span>
                          <span className="text-xs text-muted-foreground truncate hidden sm:block">
                            {asset.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-sm sm:text-base font-medium">
                          <NumberFormat value={asset.priceRaw} isPrice={true} />
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            asset.change24h >= 0 ? 'text-success' : 'text-destructive'
                          }`}
                        >
                          {asset.change24h >= 0 ? '+' : ''}
                          <NumberFormat value={asset.change24h} />%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
