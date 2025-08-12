'use client';

import { useMemo, useState } from 'react';
import { usePortfolioPositions } from '../../../hooks/portfolio/use-portfolio-positions';
import { trpc } from '../../../lib/api/trpc';
import { WalletTabContent } from '../tabs/tab-content/WalletTabContent';
import { WalletTabControls, WalletTabType } from '../tabs/WalletTabControls';

export const WalletBreakdown = () => {
  const [activeTab, setActiveTab] = useState<WalletTabType>('baskts');

  const { positions, isLoading: positionsLoading, error: positionsError } = usePortfolioPositions();

  const basktsQuery = trpc.baskt.getAllBaskts.useQuery(
    { withPerformance: true },
    {
      refetchInterval: 30 * 1000,
    },
  );

  const isLoading = positionsLoading || basktsQuery.isLoading;
  const error = positionsError || basktsQuery.error;
  const userBaskts = (basktsQuery.data as any)?.data || [];

  const tradedBaskts = useMemo(() => {
    if (!positions || positions.length === 0) return [];

    const basketMap = new Map();

    const validBaskts = userBaskts.filter((b: any) => b && b.basktId);

    positions.forEach((position: any) => {
      if (!position || !position.basktId) return;
      const basket = validBaskts.find((b: any) => b.basktId === position.basktId);
      if (!basket || !basket.basktId) return;
      const basketName = basket.name || basket.basktId || 'Unknown Basket';
      const positionValue = position.usdcSize ? Number(position.usdcSize) / 1e6 : 0;

      const assetData =
        basket?.assets
          ?.map((asset: any) => ({
            ticker: asset.ticker,
            logo: asset.logo,
            name: asset.name,
          }))
          .filter((asset: any) => asset.ticker) || [];

      if (!basketMap.has(position.basktId)) {
        basketMap.set(position.basktId, {
          id: position.basktId,
          name: basketName,
          value: 0,
          percentage: 0,
          change24h: basket?.performance?.daily || 0,
          assets: assetData,
          positions: [],
        });
      }

      const basketData = basketMap.get(position.basktId);
      basketData.value += positionValue;
      basketData.positions.push(position);
    });

    const basketArray = Array.from(basketMap.values());
    const totalValue = basketArray.reduce((sum, basket) => sum + basket.value, 0);

    basketArray.forEach((basket) => {
      basket.percentage = totalValue > 0 ? (basket.value / totalValue) * 100 : 0;
    });

    return basketArray.sort((a, b) => b.value - a.value);
  }, [positions, userBaskts]);

  const uniqueAssets = useMemo(() => {
    const assetMap = new Map();

    tradedBaskts.forEach((baskt: any) => {
      const basketAssets = baskt.assets || [];
      const basketPercentage = baskt.percentage || 0;

      basketAssets.forEach((asset: any) => {
        if (asset.ticker) {
          if (!assetMap.has(asset.ticker)) {
            assetMap.set(asset.ticker, {
              ticker: asset.ticker,
              logo: asset.logo,
              name: asset.name,
              totalValue: 0,
              percentage: 0,
              basketCount: 0,
            });
          }

          const assetData = assetMap.get(asset.ticker);
          assetData.totalValue += basketPercentage;
          assetData.basketCount += 1;
        }
      });
    });

    const totalPercentage = Array.from(assetMap.values()).reduce(
      (sum, asset) => sum + asset.totalValue,
      0,
    );

    return Array.from(assetMap.values())
      .map((asset) => ({
        ...asset,
        percentage: totalPercentage > 0 ? (asset.totalValue / totalPercentage) * 100 : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [tradedBaskts]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2"></div>
          </div>
          <div className="inline-flex items-center gap-1 border border-border rounded-lg p-1 bg-background">
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">Failed to load wallet breakdown</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Wallet breakdown</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {tradedBaskts.length > 0
              ? `Your traded baskts (${tradedBaskts.length})`
              : 'No traded baskts yet'}
          </p>
        </div>

        <WalletTabControls activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <WalletTabContent
        activeTab={activeTab}
        tradedBaskts={tradedBaskts}
        uniqueAssets={uniqueAssets}
        isLoading={isLoading}
        error={error}
        positions={positions}
        baskts={userBaskts}
      />
    </div>
  );
};
