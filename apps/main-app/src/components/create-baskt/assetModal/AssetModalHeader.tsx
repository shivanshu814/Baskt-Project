'use client';

import { Button, DialogHeader, DialogTitle } from '@baskt/ui';
import { X } from 'lucide-react';
import { AssetModalHeaderProps } from '../../../types/asset';
import { SelectedAssetChip } from './SelectedAssetChip';

export const AssetModalHeader = ({
  selectedAssetIds,
  selectedAssetsList,
  onSelectAll,
  onClose,
  onAssetRemove,
  isLoading,
  filteredAssetsCount,
}: AssetModalHeaderProps) => (
  <DialogHeader className="relative p-4 sm:p-6 border-b border-border/50 flex-shrink-0 bg-background/80 backdrop-blur-sm">
    <div className="flex items-center justify-between w-full">
      <div>
        <DialogTitle className="text-lg sm:text-xl font-semibold">Select Asset</DialogTitle>
        <div className="text-sm text-muted-foreground mt-1">
          {selectedAssetIds.size} selected (max 10)
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          Choose up to 10 assets to add to your Baskt. You can search by name or ticker.
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          className="h-8 px-3 text-xs font-medium"
          disabled={isLoading || filteredAssetsCount === 0 || selectedAssetIds.size >= 10}
        >
          Select All
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 flex-shrink-0 hover:bg-foreground/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>

    {/* selected assets chips */}
    {selectedAssetIds.size > 0 && (
      <div className="mt-4 pt-4 border-t border-border/30">
        <div className="text-xs text-muted-foreground mb-3 font-medium">
          Selected Assets ({selectedAssetIds.size}/10)
        </div>
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
          {selectedAssetsList.map((asset) => (
            <SelectedAssetChip key={asset._id} asset={asset} onRemove={onAssetRemove} />
          ))}
        </div>
      </div>
    )}
  </DialogHeader>
);
