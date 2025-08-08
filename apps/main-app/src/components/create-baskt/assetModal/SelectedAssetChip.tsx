'use client';

import { X } from 'lucide-react';
import { SelectedAssetChipProps } from '../../../types/asset';
import { AssetLogo } from './AssetLogo';

export const SelectedAssetChip = ({ asset, onRemove }: SelectedAssetChipProps) => (
  <div className="flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-sm px-3 py-1.5 group hover:bg-primary/25 transition-all duration-200 shadow-sm">
    <AssetLogo ticker={asset.ticker} logo={asset.logo} size="sm" />
    <span className="text-xs font-semibold text-foreground">{asset.ticker}</span>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onRemove(asset._id!);
      }}
      className="flex-shrink-0 h-4 w-4 rounded-full bg-muted/60 flex items-center justify-center transition-all duration-200"
    >
      <X className="h-2.5 w-2.5 text-muted-foreground hover:text-foreground" />
    </button>
  </div>
);
