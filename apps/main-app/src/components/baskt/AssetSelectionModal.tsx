'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../src/dialog';
import { Input } from '../src/input';
import { Button } from '../src/button';
import { Search } from 'lucide-react';
import { Asset } from '../../types/baskt';
import { useBasktClient } from '@baskt/ui';
import { toast } from 'sonner';

interface AssetSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssetSelect: (asset: Asset) => void;
}

export function AssetSelectionModal({
  open,
  onOpenChange,
  onAssetSelect,
}: AssetSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { client } = useBasktClient();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      if (!client) return;
      try {
        setIsLoading(true);
        const onchainAssets = await client.getAllAssets();

        const dbAssets = await Promise.all(
          onchainAssets.map(async (asset) => {
            try {
              const addressToMatch = asset.address.toString();
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/asset.getAssetByAddress?input=${JSON.stringify({ assetAddress: addressToMatch })}`,
              );
              const data = await response.json();
              return {
                id: addressToMatch,
                logo: data.result.data.data?.logo || null,
              };
            } catch (error) {
              toast.error('Error fetching assets');
              return null;
            }
          }),
        );

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const formattedAssets = onchainAssets.map((asset, index) => ({
          id: asset.address.toString(),
          name: asset.ticker,
          symbol: asset.ticker,
          price: 0,
          change24h: 0,
          position: 'long' as const,
          weightage: 0,
          volume24h: 0,
          marketCap: 0,
          logo:
            dbAssets.find((dbAsset) => dbAsset?.id === asset.address.toString())?.logo ||
            `https://cdn.prod.website-files.com/618bdb39629b12a794c27a72/62697482365e15d095f0b1d0_Web%203.png`,
        }));
        setAssets(formattedAssets);
      } catch (error) {
        toast.error('Error fetching assets');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
  }, [client]); // eslint-disable-line

  const filteredAssets = assets.filter(
    (asset) =>
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()),
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
                  key={asset.symbol}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => onAssetSelect(asset)}
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 h-8 w-8 rounded-full flex items-center justify-center overflow-hidden">
                      <img src={asset.logo} alt={asset.symbol} className="w-6 h-6 object-contain" />
                    </div>
                    <div>
                      <div className="font-medium">{asset.symbol}</div>
                      <div className="text-xs text-muted-foreground">{asset.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${asset.price.toLocaleString()}</div>
                    <div
                      className={`text-xs ${asset.change24h >= 0 ? 'text-success' : 'text-destructive'}`}
                    >
                      {asset.change24h >= 0 ? '+' : ''}
                      {asset.change24h.toFixed(2)}%
                    </div>
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
