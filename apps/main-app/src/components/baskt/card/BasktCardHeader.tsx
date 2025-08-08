'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  NumberFormat,
} from '@baskt/ui';
import { ExternalLink, Info, MoreVertical, Share2 } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { useShareLink } from '../../../hooks/shared/use-share-link';
import { BasktCardHeaderProps } from '../../../types/baskt';
import { AssetLogo } from '../../create-baskt/assetModal/AssetLogo';

export const BasktCardHeader = React.memo(
  ({
    baskt,
    assetImages,
    extraAssets,
    assetCount,
    basktPrice,
    performanceData,
    safeBasktName,
    handlers,
    setOpen,
  }: BasktCardHeaderProps) => {
    const { shareBasktLink } = useShareLink();

    const handleShareClick = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await shareBasktLink(safeBasktName);
    };

    return (
      <div className="flex w-full items-center justify-between gap-3 min-h-[64px] select-none">
        <div className="ml-3 flex items-center gap-2 min-w-0 flex-1">
          <div className="flex flex-col min-w-0">
            <Link
              href={`/trade/${encodeURIComponent(safeBasktName)}`}
              className="group flex items-center gap-1 max-w-[120px] truncate text-base font-semibold"
              onClick={handlers.handleExternalLinkClick}
            >
              <span className="truncate group-hover:underline group-focus:underline">
                {baskt.name || 'Unnamed Baskt'}
              </span>
              <ExternalLink className="ml-2 w-4 h-4 text-muted-foreground hover:text-foreground" />
            </Link>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex -space-x-2">
                {assetImages.map((asset, idx) => (
                  <div key={`${asset.ticker || asset.name || idx}`} className="relative z-10">
                    <AssetLogo
                      ticker={asset.ticker || asset.name || 'Asset'}
                      logo={asset.logo || ''}
                      size="sm"
                    />
                  </div>
                ))}
                {extraAssets > 0 && (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground border border-border ml-1">
                    +{extraAssets}
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {assetCount} asset{assetCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-right justify-end flex-1 mr-4">
          <div className="flex flex-col items-right">
            <span className="text-lg font-bold text-foreground whitespace-nowrap">
              <NumberFormat value={basktPrice} isPrice={true} showCurrency={true} />
            </span>
            {performanceData.day !== undefined && (
              <span
                className={`text-xs font-medium ${
                  performanceData.day >= 0 ? 'text-green-500' : 'text-red-500'
                } text-right block`}
              >
                {performanceData.day >= 0 ? '+' : ''}
                {performanceData.day.toFixed(2)}%
              </span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 ml-2 hover:bg-transparent border-none dropdown-button inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              style={{ marginLeft: '-8rem', marginTop: '-0.5rem', borderRadius: '5px' }}
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handlers.handleTradeClick(e);
                }}
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Trade Baskt
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShareClick}>
                <span className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share Baskt
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((prev) => (prev === 'baskt' ? undefined : 'baskt'));
                }}
              >
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Baskt Details
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  },
);

BasktCardHeader.displayName = 'BasktCardHeader';
