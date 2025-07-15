'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  NumberFormat,
  useBasktClient,
  Button,
} from '@baskt/ui';
import { Search, X, X as XIcon, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '../../../utils/common/trpc';
import { AssetSelectionModalProps } from '../../../types/baskt';
import { generateAssetUrl } from '../../../utils/asset/assetUtils';
import Image from 'next/image';

const AssetSkeleton = () => (
  <div className="flex items-center justify-between py-3 px-3 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted flex-shrink-0"></div>
      <div className="flex flex-col min-w-0">
        <div className="h-4 w-16 bg-muted rounded mb-1"></div>
        <div className="h-3 w-24 bg-muted rounded"></div>
      </div>
    </div>
    <div className="flex flex-col items-end flex-shrink-0">
      <div className="h-4 w-12 bg-muted rounded mb-1"></div>
      <div className="h-3 w-8 bg-muted rounded"></div>
    </div>
  </div>
);

export function AssetSelectionModal({
  open,
  onOpenChange,
  onAssetSelect,
  onMultipleAssetSelect,
  multipleSelection = false,
  selectedAssets = [],
}: AssetSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { client } = useBasktClient();
  const [assets, setAssets] = useState<any[]>([]); // eslint-disable-line
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssetAddresses, setSelectedAssetAddresses] = useState<Set<string>>(
    new Set(selectedAssets.map((asset) => asset.assetAddress)),
  );

  const {
    data: assetsData,
    isSuccess: assetDataFetchSuccess,
    isLoading: isQueryLoading,
  } = trpc.asset.getAllAssets.useQuery(
    { withLatestPrices: false, withConfig: true },
    {
      staleTime: 30 * 1000,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  );

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
  }, [client, assetDataFetchSuccess, assetsData]);

  const filteredAssets = assets.filter(
    (asset) =>
      asset.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.assetAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.description && asset.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleAssetToggle = (asset: any) => {
    if (multipleSelection) {
      const newSelected = new Set(selectedAssetAddresses);
      if (newSelected.has(asset.assetAddress)) {
        newSelected.delete(asset.assetAddress);
      } else {
        newSelected.add(asset.assetAddress);
      }
      setSelectedAssetAddresses(newSelected);
    } else {
      onAssetSelect(asset);
      setSearchQuery('');
    }
  };

  const handleRemoveSelectedAsset = (assetAddress: string) => {
    const newSelected = new Set(selectedAssetAddresses);
    newSelected.delete(assetAddress);
    setSelectedAssetAddresses(newSelected);
  };

  const handleDone = () => {
    if (multipleSelection && onMultipleAssetSelect) {
      const selectedAssetsList = assets.filter((asset) =>
        selectedAssetAddresses.has(asset.assetAddress),
      );
      onMultipleAssetSelect(selectedAssetsList);
      setSelectedAssetAddresses(new Set());
      setSearchQuery('');
    }
  };

  const handleClose = () => {
    if (multipleSelection) {
      setSelectedAssetAddresses(new Set());
    }
    setSearchQuery('');
    onOpenChange(false);
  };

  const handleSelectAll = () => {
    if (multipleSelection) {
      const allAddresses = new Set(filteredAssets.map((asset) => asset.assetAddress));
      setSelectedAssetAddresses(allAddresses);
    }
  };

  const handleClearSelection = () => {
    if (multipleSelection) {
      setSelectedAssetAddresses(new Set());
    }
  };

  const handleAssetNameClick = (asset: any, event: React.MouseEvent) => {
    event.stopPropagation();
    const url = generateAssetUrl(asset);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1300px] max-w-[98vw] w-full p-0 rounded-2xl overflow-hidden shadow-2xl border-0 bg-background/95 backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="relative p-4 sm:p-6 border-b border-border/50 flex-shrink-0 bg-background/80 backdrop-blur-sm">
            <div className="flex items-center w-full">
              <DialogTitle className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Select Asset
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="ml-auto h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 hover:bg-foreground/10 hover:scale-105 transition-all duration-200"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
            {multipleSelection && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-x-3 gap-y-1 w-full mt-1">
                <div className="text-sm text-muted-foreground text-left w-full sm:text-left">
                  {selectedAssetAddresses.size} selected
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-7 px-2 text-xs font-medium"
                  >
                    Select All
                  </Button>
                  {selectedAssetAddresses.size > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearSelection}
                      className="h-7 px-2 text-xs font-medium"
                    >
                      Clear
                    </Button>
                  )}
                  {selectedAssetAddresses.size > 0 && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleDone}
                      className="h-8 px-3 text-xs font-medium"
                    >
                      Done
                    </Button>
                  )}
                </div>
              </div>
            )}
            <DialogDescription className="text-sm mt-2 text-muted-foreground max-w-xs sm:max-w-md text-left">
              {multipleSelection
                ? 'Choose multiple assets to add to your Baskt. You can search by name or ticker.'
                : 'Choose an asset to add to your Baskt. You can search by name or ticker.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col space-y-4 p-4 sm:p-6 flex-1 min-h-0">
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-4 py-3 rounded-xl bg-foreground/5 border border-border/50 text-foreground placeholder:text-muted-foreground text-sm sm:text-base focus:ring-2 focus:ring-primary/20 focus:border-primary/50 hover:bg-foreground/10 transition-all duration-200 shadow-sm"
              />
            </div>

            {multipleSelection && selectedAssetAddresses.size > 0 && (
              <div className="flex-shrink-0">
                <div className="text-xs text-muted-foreground mb-2 px-1">
                  Selected Assets ({selectedAssetAddresses.size})
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {assets
                    .filter((asset) => selectedAssetAddresses.has(asset.assetAddress))
                    .map((asset) => (
                      <div
                        key={asset.assetAddress}
                        className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 group hover:bg-primary/20 transition-all duration-200"
                      >
                        <div className="h-4 w-4 rounded-full flex-shrink-0 ring-1 ring-border/20 overflow-hidden">
                          <Image
                            src={asset.logo}
                            alt={asset.ticker}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                            width={16}
                            height={16}
                            unoptimized
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground truncate max-w-20">
                          {asset.ticker}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSelectedAsset(asset.assetAddress);
                          }}
                          className="flex-shrink-0 h-4 w-4 rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-all duration-200 group-hover:bg-destructive/20"
                        >
                          <XIcon className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-1">
              {isLoading || isQueryLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <AssetSkeleton key={index} />
                  ))}
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center animate-pulse">
                    <Search className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <p className="font-medium mb-1">
                    {searchQuery ? 'No assets found' : 'No assets available'}
                  </p>
                  <p className="text-xs opacity-70">
                    {searchQuery ? 'Try adjusting your search terms' : 'Please check back later'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="text-xs text-muted-foreground px-1 pb-2">
                    {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''} found
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-w-full px-2 py-2">
                    {filteredAssets.map((asset) => {
                      const assetUrl = generateAssetUrl(asset);
                      return (
                        <div
                          key={asset.assetAddress}
                          onClick={() => handleAssetToggle(asset)}
                          className={`relative border border-border/50 flex flex-row items-center p-3 bg-white dark:bg-background rounded-xl shadow group hover:border-primary hover:shadow-lg cursor-pointer transition-all duration-200 min-h-[50px] w-full ${
                            multipleSelection && selectedAssetAddresses.has(asset.assetAddress)
                              ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                              : ''
                          }`}
                        >
                          <div className="flex items-center mr-4">
                            <div className="h-6 w-6 sm:h-10 sm:w-10 rounded-full flex-shrink-0 ring-1 ring-border/20 group-hover:ring-border/40 transition-all duration-200 bg-muted overflow-hidden">
                              <Image
                                src={asset.logo}
                                alt={asset.ticker}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                                width={40}
                                height={40}
                                unoptimized
                              />
                            </div>
                          </div>
                          <div className="flex flex-1 flex-row justify-between items-center w-full">
                            <div className="flex flex-col justify-center min-w-0">
                              <div
                                className={`text-sm font-bold truncate ${
                                  multipleSelection &&
                                  selectedAssetAddresses.has(asset.assetAddress)
                                    ? 'text-primary'
                                    : 'text-foreground'
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  {assetUrl ? (
                                    <button
                                      onClick={(e) => handleAssetNameClick(asset, e)}
                                      className="hover:text-primary hover:underline transition-all duration-200 cursor-pointer"
                                    >
                                      {asset.ticker}
                                    </button>
                                  ) : (
                                    <span>{asset.ticker}</span>
                                  )}
                                  {multipleSelection &&
                                    selectedAssetAddresses.has(asset.assetAddress) && (
                                      <CheckCheck className="h-3 w-3 text-primary flex-shrink-0" />
                                    )}
                                </div>
                              </div>
                              <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate max-w-[120px]">
                                {asset.name.length > 40
                                  ? `${asset.name.slice(0, 5)}...${asset.name.slice(-8)}`
                                  : asset.name}
                              </div>
                            </div>
                            <div className="flex flex-col items-end justify-center min-w-[70px]">
                              <span
                                className={`text-sm sm:text-base font-bold transition-all duration-200 ${
                                  asset.change24h >= 0
                                    ? 'text-green-500 group-hover:text-green-400'
                                    : 'text-red-500 group-hover:text-red-400'
                                }`}
                              >
                                {asset.change24h >= 0 ? '+' : ''}
                                <NumberFormat value={asset.change24h} />%
                              </span>
                              <div className="text-sm font-semibold mt-1 text-foreground/90">
                                $
                                {(() => {
                                  const price = asset.priceRaw / 1e6;
                                  return price < 1 ? price.toFixed(6) : price.toFixed(3);
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
