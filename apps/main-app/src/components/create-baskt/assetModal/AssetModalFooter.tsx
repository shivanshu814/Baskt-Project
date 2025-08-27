'use client';

import { Button } from '@baskt/ui';
import { AssetModalFooterProps } from '../../../types/asset';

export const AssetModalFooter = ({ selectedAssetIds, onClear, onDone }: AssetModalFooterProps) => {
  if (selectedAssetIds.size === 0) return null;

  return (
    <div className="p-4 sm:p-6 border-t border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedAssetIds.size} asset{selectedAssetIds.size !== 1 ? 's' : ''} selected
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClear} className="h-8 px-3 text-xs">
            Clear
          </Button>
          <Button
            onClick={onDone}
            disabled={selectedAssetIds.size < 2}
            className="h-8 px-4 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
