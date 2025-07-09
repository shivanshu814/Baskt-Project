import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Button,
  NumberFormat,
  cn,
} from '@baskt/ui';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useCallback, useMemo } from 'react';
import { useBasktOI } from '../../hooks/baskt/useBasktOI';
import { BasktInfo, BasktAssetInfo } from '@baskt/types';
import { calculateCurrentWeights } from '@baskt/sdk/src/math/weight';
interface BasktCardProps {
  baskt: BasktInfo;
  className?: string;
}
interface MetricCard {
  label: string;
  value: React.ReactNode;
  color?: string;
}

// const REBALANCE_ANIMATION_KEYFRAMES = `
//   @keyframes rebalance-bar-move {
//     0% { left: 0; width: 30%; }
//     50% { left: 60%; width: 40%; }
//     100% { left: 0; width: 30%; }
//   }
//   .rebalance-bar-anim {
//     animation: rebalance-bar-move 1.2s linear infinite;
//   }
// `;

const ASSET_DISPLAY_LIMIT = 2;
const SHARPE_RATIO = '1.2';

// const RebalancingBar = React.memo(() => (
//   <div className="flex flex-col items-center w-40">
//     <style>{REBALANCE_ANIMATION_KEYFRAMES}</style>
//     <div className="w-full h-2 bg-primary/20 rounded-full overflow-hidden relative">
//       <div
//         className="absolute top-0 h-2 bg-primary rounded-full rebalance-bar-anim"
//         style={{ left: 0, width: '40%' }}
//       />
//     </div>
//     <span className="text-xs text-primary font-medium mt-1">Rebalancing</span>
//   </div>
// ));

// RebalancingBar.displayName = 'RebalancingBar';

const AssetIcon = React.memo(({ asset }: { asset: BasktAssetInfo }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  if (asset.logo && !imageError) {
    return (
      <img
        src={asset.logo}
        alt={asset.ticker || asset.name || 'Asset'}
        className="w-7 h-7 rounded-full border border-border flex-shrink-0"
        onError={handleImageError}
      />
    );
  }

  return (
    <div
      className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground border border-border"
      title={asset.name || asset.ticker}
    >
      {asset.ticker?.[0] || asset.name?.[0] || '?'}
    </div>
  );
});

AssetIcon.displayName = 'AssetIcon';

const AssetRow = React.memo(
  ({ asset, currentWeight }: { asset: BasktAssetInfo; currentWeight?: number }) => (
    <div className="flex items-center px-2 sm:px-3 py-2 border-t border-border bg-background/80 text-xs sm:text-sm">
      <span className="flex-1 flex items-center">
        <span className="mr-2">
          <AssetIcon asset={asset} />
        </span>
        <span className="truncate font-medium">{asset.name || asset.ticker}</span>
      </span>
      <span className="flex-1 text-center">
        {asset.price !== undefined ? <NumberFormat value={asset.price} isPrice={true} /> : '-'}
      </span>
      <span className="flex-1 text-center">
        <span className={asset.direction ? 'text-green-600' : 'text-red-600'}>
          {asset.direction ? 'Long' : 'Short'}
        </span>
      </span>
      <span className="flex-1 text-center">
        {asset.weight !== undefined ? <NumberFormat value={asset.weight} /> : '-'}%
      </span>
      <span className="flex-1 text-right">
        {currentWeight !== undefined ? <NumberFormat value={currentWeight} /> : '-'}%
      </span>
    </div>
  ),
);

AssetRow.displayName = 'AssetRow';

const MetricCard = React.memo(({ card }: { card: MetricCard }) => (
  <div
    className="flex-1 min-w-[110px] max-w-[180px] flex flex-col items-center bg-muted/30 rounded-md px-2 sm:px-3 py-2 text-center"
    style={{ flexBasis: '120px' }}
  >
    <span className="text-xs sm:text-xs text-muted-foreground">{card.label}</span>
    <span className={`font-semibold text-xs sm:text-sm ${card.color || ''}`}>{card.value}</span>
  </div>
));

MetricCard.displayName = 'MetricCard';

export const BasktCard = React.memo(({ baskt, className }: BasktCardProps) => {
  const router = useRouter();
  const [open, setOpen] = useState<string | undefined>(undefined);

  const { assetCount, assetImages, extraAssets, assetPrice, performanceData } = useMemo(() => {
    const assets = baskt.assets || [];
    const assetCount = assets.length;
    const assetImages = assets.slice(0, ASSET_DISPLAY_LIMIT);
    const extraAssets = assetCount > ASSET_DISPLAY_LIMIT ? assetCount - ASSET_DISPLAY_LIMIT : 0;
    const assetPrice = baskt.price || 0;

    const performanceData = {
      day: baskt.performance?.day,
      week: baskt.performance?.week,
      month: baskt.performance?.month,
    };

    return {
      assetCount,
      assetImages,
      extraAssets,
      assetPrice,
      performanceData,
    };
  }, [baskt.assets, baskt.price, baskt.performance]);

  const currentWeights = useMemo(() => {
    const assets = baskt.assets || [];
    if (
      assets.length === 0 ||
      assets.some((a: any) => a.price === undefined || a.baselinePrice === undefined) //eslint-disable-line
    ) {
      return assets.map((asset: any) => asset.weight); //eslint-disable-line
    }

    // eslint-disable-next-line
    const basktAssets = assets.map((asset: any) => ({
      id: asset.id || asset.assetAddress || '',
      name: asset.name || '',
      ticker: asset.ticker || '',
      price: asset.price || 0,
      change24h: asset.change24h || 0,
      volume24h: asset.volume24h || 0,
      marketCap: asset.marketCap || 0,
      assetAddress: asset.assetAddress || asset.id || '',
      logo: asset.logo || '',
      weight: asset.weight || 0,
      direction: asset.direction || true,
      baselinePrice: asset.baselinePrice || asset.price || 0,
    }));
    return calculateCurrentWeights(basktAssets);
  }, [baskt.assets]);
  const { totalOpenInterest } = useBasktOI(baskt.basktId as string);

  const metricCards = useMemo(
    (): MetricCard[] => [
      {
        label: 'OI',
        value:
          totalOpenInterest !== undefined ? (
            <NumberFormat value={totalOpenInterest} isPrice={true} />
          ) : (
            '--'
          ),
      },
      {
        label: '24h',
        value:
          performanceData.day !== undefined
            ? `${performanceData.day >= 0 ? '+' : ''}${performanceData.day}%`
            : '--',
        color:
          performanceData.day !== undefined && performanceData.day >= 0
            ? 'text-green-500'
            : 'text-red-500',
      },
      {
        label: '7d',
        value:
          performanceData.week !== undefined
            ? `${performanceData.week >= 0 ? '+' : ''}${performanceData.week}%`
            : '--',
        color:
          performanceData.week !== undefined && performanceData.week >= 0
            ? 'text-green-500'
            : 'text-red-500',
      },
      {
        label: '30d',
        value:
          performanceData.month !== undefined
            ? `${performanceData.month >= 0 ? '+' : ''}${performanceData.month}%`
            : '--',
        color:
          performanceData.month !== undefined && performanceData.month >= 0
            ? 'text-green-500'
            : 'text-red-500',
      },
      { label: 'Sharpe', value: SHARPE_RATIO },
    ],
    [baskt.aum, assetCount, totalOpenInterest, performanceData],
  );

  const safeBasktName =
    typeof baskt.name === 'string' && baskt.name.length > 0 ? baskt.name : 'unnamed';

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    const trigger = (e.currentTarget as HTMLElement).querySelector('[data-accordion-trigger]');
    if (trigger && trigger.contains(e.target as Node)) {
      return;
    }
    setOpen((prev) => (prev === 'baskt' ? undefined : 'baskt'));
  }, []);

  const handleTradeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/baskts/${encodeURIComponent(safeBasktName)}`);
    },
    [router, safeBasktName],
  );

  const handleAccordionTriggerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleExternalLinkClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Accordion
      type="single"
      collapsible
      value={open}
      onValueChange={setOpen}
      className={cn(
        'rounded-xl !-mb-4 border border-border bg-background/80 hover:bg-background/90 transition-colors duration-200 cursor-pointer m-0',
        className,
      )}
    >
      <AccordionItem value="baskt" className="m-0 border-none px-2 py-2">
        <div
          className="flex w-full items-center justify-between gap-3 min-h-[64px] select-none"
          onClick={handleCardClick}
          style={{ cursor: 'pointer' }}
        >
          <AccordionTrigger
            className="p-1 h-6 w-6 border-border border rounded-md"
            data-accordion-trigger
            onClick={handleAccordionTriggerClick}
          />

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex flex-col min-w-0">
              <span className="text-base font-semibold truncate max-w-[120px] flex items-center gap-1">
                {baskt.name || 'Unnamed Baskt'}
                <Link
                  href={`/baskts/${encodeURIComponent(safeBasktName)}`}
                  className="ml-1"
                  onClick={handleExternalLinkClick}
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </Link>
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex -space-x-2">
                  {assetImages.map((asset, idx) => (
                    <div key={`${asset.ticker || asset.name || idx}`} className="relative z-10">
                      <AssetIcon asset={asset} />
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

          <div className="flex items-center justify-center flex-1 hidden sm:flex">
            {/* Rebalancing indicator removed - not available in BasktInfo */}
          </div>
          <div className="flex items-right justify-end flex-1 mr-4">
            <div className="flex flex-col items-right">
              <span className="text-lg font-bold text-foreground whitespace-nowrap">
                <NumberFormat value={assetPrice} isPrice={true} />
              </span>
              {performanceData.day !== undefined && (
                <span
                  className={`text-xs font-medium ${
                    performanceData.day >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {performanceData.day >= 0 ? '+' : ''}
                  <NumberFormat value={performanceData.day} />%
                </span>
              )}
            </div>
          </div>
          <Button size="sm" onClick={handleTradeClick} className="px-4 mr-4">
            Trade
          </Button>
        </div>

        <AccordionContent className="px-2 sm:px-4 pb-3 pt-0 mt-8">
          <div className="flex flex-wrap gap-2 gap-y-2 mb-4 items-center w-full overflow-x-auto justify-between">
            {metricCards.map((card) => (
              <MetricCard key={card.label} card={card} />
            ))}
          </div>

          <div className="mt-2 rounded-lg border border-border bg-muted/10 overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-muted-foreground">
                <span className="flex-1 text-left">Asset</span>
                <span className="flex-1 text-center">Price</span>
                <span className="flex-1 text-center">Direction</span>
                <span className="flex-1 text-center whitespace-nowrap">Target Weight</span>
                <span className="flex-1 text-right whitespace-nowrap">Current Weight</span>
              </div>
              {(baskt.assets || []).map((asset, idx) => (
                <AssetRow
                  key={`${asset.ticker || asset.name || idx}`}
                  asset={asset}
                  currentWeight={currentWeights[idx]}
                />
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
});

BasktCard.displayName = 'BasktCard';
