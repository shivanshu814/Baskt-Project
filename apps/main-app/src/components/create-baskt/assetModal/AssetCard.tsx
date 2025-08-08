'use client';

import { NumberFormat } from '@baskt/ui';
import { Check } from 'lucide-react';
import { useCallback } from 'react';
import { AssetCardProps } from '../../../types/asset';
import { AssetLogo } from './AssetLogo';

export const AssetCard = ({ asset, isSelected, onToggle }: AssetCardProps) => {
  const handleClick = useCallback(() => onToggle(asset._id!), [asset._id, onToggle]);

  return (
    // asset card
    <div
      onClick={handleClick}
      className={`relative border border-border/30 rounded-lg p-3 cursor-pointer transition-all duration-200 min-h-[100px] ${
        isSelected
          ? 'border-primary bg-primary/10 ring-1 ring-primary/20'
          : 'bg-card/30 hover:border-border/50 hover:bg-card/50'
      }`}
    >
      {/* selection check */}
      {isSelected && (
        <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </div>
      )}

      {/* asset content */}
      <div className="flex items-center h-full p-2">
        {/* left side - asset icon */}
        <div className="flex items-center justify-center mr-3">
          <AssetLogo ticker={asset.ticker} logo={asset.logo} size="md" />
        </div>

        {/* middle section - asset info */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <div className="font-bold text-base text-foreground">{asset.ticker}</div>
            {asset.account?.isActive && <div className="h-2 w-2 bg-green-500 rounded-full" />}
          </div>
          <div className="text-xs text-muted-foreground">
            {asset.name.length > 40
              ? `${asset.name.slice(0, 5)}...${asset.name.slice(-8)}`
              : asset.name}
          </div>
        </div>

        {/* right side - price and change */}
        <div className="flex flex-col items-end justify-center">
          <div
            className={`text-sm font-medium ${
              asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {asset.change24h >= 0 ? '+' : ''}
            {asset.change24h.toFixed(2)}%
          </div>
          <div className="font-semibold text-sm text-foreground">
            <NumberFormat value={asset.price} isPrice={true} showCurrency={true} />
          </div>
        </div>
      </div>
    </div>
  );
};
