'use client';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  NumberFormat,
} from '@baskt/ui';
import { ExternalLink, Info, MoreVertical, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useShareLink } from '../../../hooks/shared/use-share-link';
import { ROUTES } from '../../../routes/route';
import { BasktCardHeaderProps } from '../../../types/baskt';
import { AssetLogo } from '../../create-baskt/assetModal/AssetLogo';

export const BasktCardHeader = React.memo(
  ({ baskt, assets, metrics, setOpen }: BasktCardHeaderProps) => {
    const { shareBasktLink } = useShareLink();
    const router = useRouter();

    const handleShareClick = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await shareBasktLink(baskt.basktId);
    };

    return (
      <div className="flex w-full items-center justify-between gap-3 min-h-[64px] select-none">
        <div className="ml-3 flex items-center gap-2 min-w-0 flex-1">
          <div className="flex flex-col min-w-0">
            <Link
              href={`${ROUTES.TRADE}/${encodeURIComponent(baskt.basktId)}`}
              className="group flex items-center gap-1 text-base font-semibold"
            >
              <span className="truncate max-w-[120px] group-hover:underline group-focus:underline">
                {baskt.name || ''}
              </span>
              <ExternalLink className="ml-2 w-4 h-4 text-muted-foreground hover:text-foreground shrink-0" />
            </Link>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex -space-x-2">
                {assets?.slice(0, 3).map((assetItem: any, idx: number) => {
                  return (
                    <div
                      key={`${assetItem.ticker || assetItem.name || idx}`}
                      className="relative z-10"
                    >
                      <AssetLogo
                        ticker={assetItem.ticker || assetItem.name || 'Asset'}
                        logo={assetItem.logo || ''}
                        size="sm"
                      />
                    </div>
                  );
                })}
                {baskt.totalAssets > 3 && (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground border border-border ml-1">
                    +{baskt.totalAssets - 3}
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {baskt.totalAssets} asset{baskt.totalAssets !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-right justify-end flex-1 mr-4">
          <div className="flex flex-col items-right">
            <span className="text-lg font-bold text-foreground whitespace-nowrap">
              <NumberFormat
                value={Number(metrics?.currentNav || metrics?.baselineNav)}
                isPrice={true}
                showCurrency={true}
              />
            </span>
            {metrics?.performance?.daily !== undefined && (
              <span
                className={`text-xs font-medium ${
                  metrics.performance.daily > 0
                    ? 'text-green-500'
                    : metrics.performance.daily < 0
                    ? 'text-red-500'
                    : 'text-text'
                } text-right block`}
              >
                {metrics.performance.daily > 0 ? '+' : ''}
                {metrics.performance.daily.toFixed(2)}%
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`${ROUTES.TRADE}/${encodeURIComponent(baskt.basktId)}`);
            }}
            className="ml-4 mt-1 mr-2 bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10"
          >
            Trade
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 hover:bg-transparent border-none dropdown-button inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50"
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
                  router.push(`${ROUTES.TRADE}/${encodeURIComponent(baskt.basktId)}`);
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
