'use client';

import Image from 'next/image';
import { AssetBreakdownProps } from '../../../types/asset';

export const AssetBreakdown = ({ uniqueAssets }: AssetBreakdownProps) => {
  if (!uniqueAssets || uniqueAssets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No assets found in your portfolio</p>
      </div>
    );
  }

  const displayedAssets = uniqueAssets.slice(0, 5);
  const hasMoreThanFive = uniqueAssets.length > 5;
  const otherAssets = hasMoreThanFive ? uniqueAssets.slice(5) : [];

  return (
    <div>
      <div className="mb-6">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 flex overflow-hidden mb-2">
          {displayedAssets.map((asset, index) => (
            <div
              key={asset.assetId}
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
                width: `${asset.portfolioPercentage || 0}%`,
              }}
            />
          ))}
          {hasMoreThanFive && (
            <div
              className="h-4 bg-orange-400"
              style={{
                width: `${otherAssets.reduce(
                  (sum, asset) => sum + (asset.portfolioPercentage || 0),
                  0,
                )}%`,
              }}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayedAssets.map((asset) => (
          <div key={asset.assetId} className="flex items-center gap-3 p-3">
            <div className="flex items-center">
              <div className="relative w-10 h-10 flex items-center justify-center">
                {asset.assetLogo ? (
                  <Image
                    src={asset.assetLogo}
                    alt={asset.assetTicker}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
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
                  <div className="w-10 h-10 border-2 border-orange-400 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                    <span className="text-white text-xs font-bold">
                      {asset.assetTicker?.slice(0, 2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {asset.assetName}
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {asset.portfolioPercentage?.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}

        {hasMoreThanFive && (
          <div className="flex items-center gap-3 p-3 cursor-pointer">
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {otherAssets.slice(0, 4).map((asset, i) => (
                  <div key={i} className="relative w-8 h-8 flex items-center justify-center">
                    {asset.assetLogo ? (
                      <Image
                        src={asset.assetLogo}
                        alt={asset.assetTicker}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 border-2 border-orange-400 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                        <span className="text-white text-xs font-bold">
                          {asset.assetTicker?.slice(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white underline truncate">
                  Others ({otherAssets.length})
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {otherAssets
                  .reduce((sum, asset) => sum + (asset.portfolioPercentage || 0), 0)
                  .toFixed(1)}
                %
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
