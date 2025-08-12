'use client';

import Image from 'next/image';
import { useMemo } from 'react';

interface AssetBreakdownProps {
  uniqueAssets: any[];
  isLoading: boolean;
  error: any;
  positions: any[];
  baskts: any[];
}

export const AssetBreakdown = ({
  uniqueAssets,
  isLoading,
  error,
  positions,
  baskts,
}: AssetBreakdownProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
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
        <p className="text-red-600 dark:text-red-400">Failed to load asset breakdown</p>
      </div>
    );
  }

  const assetPositions = useMemo(() => {
    const assetMap = new Map();
    const validBaskts = baskts.filter((b: any) => b && b.basktId);

    positions.forEach((position: any) => {
      if (!position || !position.basktId) return;

      const baskt = validBaskts.find((b: any) => b.basktId === position.basktId);
      if (!baskt || !baskt.assets) return;

      baskt.assets.forEach((asset: any) => {
        if (!asset.ticker) return;

        if (!assetMap.has(asset.ticker)) {
          assetMap.set(asset.ticker, {
            ticker: asset.ticker,
            logo: asset.logo,
            name: asset.name,
            longCount: 0,
            shortCount: 0,
          });
        }

        const assetData = assetMap.get(asset.ticker);
        const positionIsLong = position.isLong;
        const isAssetLong = asset.direction;
        const isLong = positionIsLong === isAssetLong;

        if (isLong) {
          assetData.longCount += 1;
        } else {
          assetData.shortCount += 1;
        }
      });
    });

    const totalPositions = Array.from(assetMap.values()).reduce(
      (sum, asset) => sum + asset.longCount + asset.shortCount,
      0,
    );

    return Array.from(assetMap.values())
      .filter((asset) => asset.longCount > 0 || asset.shortCount > 0)
      .map((asset) => ({
        ...asset,
        totalCount: asset.longCount + asset.shortCount,
        longPercentage: totalPositions > 0 ? (asset.longCount / totalPositions) * 100 : 0,
        shortPercentage: totalPositions > 0 ? (asset.shortCount / totalPositions) * 100 : 0,
        totalPercentage:
          totalPositions > 0 ? ((asset.longCount + asset.shortCount) / totalPositions) * 100 : 0,
      }))
      .sort((a, b) => b.totalCount - a.totalCount);
  }, [positions, baskts]);

  return (
    <div>
      {assetPositions.length > 0 ? (
        <>
          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 flex overflow-hidden mb-2">
              {assetPositions.slice(0, 5).map((asset: any, index: number) => (
                <div
                  key={asset.ticker}
                  className={`h-4 ${
                    index === 0
                      ? 'bg-red-500'
                      : index === 1
                      ? 'bg-indigo-500'
                      : index === 2
                      ? 'bg-teal-500'
                      : index === 3
                      ? 'bg-pink-500'
                      : 'bg-cyan-500'
                  }`}
                  style={{
                    width: `${asset.totalPercentage || 0}%`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {assetPositions.map((asset: any, index: number) => (
              <div
                key={asset.ticker}
                className="flex items-center gap-1 p-1 rounded-lg border-none"
              >
                <div className="flex items-center">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    {asset.logo ? (
                      <Image
                        src={asset.logo}
                        alt={asset.ticker}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                          const nextElement = target.nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'flex';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 border-2 border-orange-400 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                        <span className="text-white text-sm font-bold">
                          {asset.ticker?.slice(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {asset.ticker} {asset.totalPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {asset.longCount > 0 && (
                      <div className="inline-flex items-center px-2 py-1 rounded-sm bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                        <div className="w-1 h-1 bg-green-500 rounded-full mr-1"></div>
                        <span className="text-[10px] text-green-700 dark:text-green-300 font-medium">
                          Long {asset.longCount}
                        </span>
                      </div>
                    )}
                    {asset.shortCount > 0 && (
                      <div className="inline-flex items-center px-2 py-1 rounded-sm bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></div>
                        <span className="text-[10px] text-red-700 dark:text-red-300 font-medium">
                          Short {asset.shortCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : uniqueAssets.length > 0 ? (
        <>
          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 flex overflow-hidden mb-2">
              {uniqueAssets.slice(0, 5).map((asset: any, index: number) => (
                <div
                  key={asset.ticker}
                  className={`h-4 ${
                    index === 0
                      ? 'bg-red-500'
                      : index === 1
                      ? 'bg-indigo-500'
                      : index === 2
                      ? 'bg-teal-500'
                      : index === 3
                      ? 'bg-pink-500'
                      : 'bg-cyan-500'
                  }`}
                  style={{
                    width: `${asset.percentage || 0}%`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {uniqueAssets.map((asset: any, index: number) => (
              <div
                key={asset.ticker}
                className="flex items-center gap-1 p-2 rounded-lg border-none"
              >
                <div className="flex items-center">
                  <div className="relative w-15 h-15 flex items-center justify-center">
                    {asset.logo ? (
                      <Image
                        src={asset.logo}
                        alt={asset.ticker}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                          const nextElement = target.nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'flex';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 border-2 border-orange-400 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                        <span className="text-white text-sm font-bold">
                          {asset.ticker?.slice(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {asset.ticker}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {asset.percentage?.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No asset positions found in your traded baskts
          </p>
        </div>
      )}
    </div>
  );
};
