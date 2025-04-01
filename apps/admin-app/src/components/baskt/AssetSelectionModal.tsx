import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/src/dialog';
import { Input } from '../../components/src/input';
import { Search } from 'lucide-react';
import { popularCryptos } from '../../data/market-data';
import { useDebounce } from '../../hooks/use-debounce';

interface AssetSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssetSelect: (asset: (typeof popularCryptos)[0]) => void;
}

export function AssetSelectionModal({
  open,
  onOpenChange,
  onAssetSelect,
}: AssetSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Filter assets based on search query
  const filteredAssets = popularCryptos.filter((asset) => {
    if (!debouncedSearch) return true;

    const query = debouncedSearch.toLowerCase();
    return asset.name.toLowerCase().includes(query) || asset.symbol.toLowerCase().includes(query);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select an Asset</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="overflow-y-auto max-h-[400px] pr-2">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No assets found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-secondary/20 cursor-pointer transition-colors"
                  onClick={() => onAssetSelect(asset)}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 h-10 w-10 rounded-full flex items-center justify-center">
                      <span className="font-medium text-primary text-sm">
                        {asset.symbol.substring(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{asset.symbol}</div>
                      <div className="text-sm text-muted-foreground">{asset.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${asset.price.toLocaleString()}</div>
                    <div
                      className={`text-sm ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {asset.change24h >= 0 ? '+' : ''}
                      {asset.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
