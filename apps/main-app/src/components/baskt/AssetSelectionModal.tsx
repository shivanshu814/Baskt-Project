'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../src/dialog';
import { Input } from '../src/input';
import { Button } from '../src/button';
import { Search } from 'lucide-react';
import { Asset } from '../../types/baskt';

interface AssetSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssetSelect: (asset: Asset) => void;
  availableAssets: Asset[];
}

export function AssetSelectionModal({
  open,
  onOpenChange,
  onAssetSelect,
  availableAssets,
}: AssetSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = availableAssets.filter(
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
            {filteredAssets.map((asset) => (
              <Button
                key={asset.symbol}
                variant="outline"
                className="w-full justify-between"
                onClick={() => onAssetSelect(asset)}
              >
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 h-8 w-8 rounded-full flex items-center justify-center">
                    <span className="font-medium text-primary text-xs">
                      {asset.symbol.substring(0, 2)}
                    </span>
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
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
