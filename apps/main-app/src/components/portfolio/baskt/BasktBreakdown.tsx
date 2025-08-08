'use client';

import { ChevronRight, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ROUTES } from '../../../routes/route';
import { BasktBreakdownProps } from '../../../types/components/ui/ui';
import { BasktModal } from './baskt-modal/BasktModal';

export const BasktBreakdown = ({ tradedBaskts, isLoading, error }: BasktBreakdownProps) => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const getBasketColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-yellow-500',
      'bg-orange-500',
    ];
    return colors[index % colors.length];
  };

  const handleOthersClick = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

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
        <p className="text-red-600 dark:text-red-400">Failed to load basket breakdown</p>
      </div>
    );
  }

  const hasMoreThanFive = tradedBaskts.length > 5;
  const displayedBaskts = hasMoreThanFive ? tradedBaskts.slice(0, 5) : tradedBaskts;
  const otherBaskts = hasMoreThanFive ? tradedBaskts.slice(5) : [];

  return (
    <div>
      {tradedBaskts.length > 0 ? (
        <>
          {/* Progress Bar with Labels */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 flex overflow-hidden mb-2">
              {displayedBaskts.map((baskt: any, index: number) => (
                <div
                  key={baskt.id || index}
                  className={`h-4 ${getBasketColor(index)}`}
                  style={{
                    width: `${baskt.percentage || 0}%`,
                  }}
                />
              ))}
              {hasMoreThanFive && (
                <div
                  className="h-4 bg-orange-400"
                  style={{
                    width: `${otherBaskts.reduce(
                      (sum: number, b: any) => sum + (b.percentage || 0),
                      0,
                    )}%`,
                  }}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedBaskts.map((baskt: any, index: number) => {
              return (
                <div
                  key={baskt.basktId || index}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer border-none"
                >
                  <div className="flex items-center">
                    <div className="flex -space-x-3">
                      {baskt.assets?.slice(0, 4).map((asset: any, i: number) => (
                        <div key={i} className="relative w-8 h-8 flex items-center justify-center">
                          {asset?.logo ? (
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
                            <div className="w-8 h-8 border-2 border-orange-400 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                              <span className="text-white text-xs font-bold">
                                {asset?.ticker?.slice(0, 2)}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 group">
                      <span
                        className="text-sm font-medium text-gray-900 dark:text-white truncate hover:underline cursor-pointer group-hover:underline"
                        onClick={() => router.push(`${ROUTES.TRADE}/${baskt.name}`)}
                      >
                        {baskt.name}
                      </span>
                      <button
                        onClick={() => router.push(`${ROUTES.TRADE}/${baskt.name}`)}
                        className="flex-shrink-0 p-1 hover:bg-primary/10 rounded-md transition-colors duration-200"
                        title="Trade this baskt"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {baskt.percentage?.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}

            {hasMoreThanFive && (
              <div
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                onClick={handleOthersClick}
              >
                <div className="flex items-center">
                  <div className="flex -space-x-3">
                    {otherBaskts.slice(0, 4).map((baskt: any, i: number) => {
                      const firstAsset = baskt.assets[0];
                      return (
                        <div key={i} className="relative w-8 h-8 flex items-center justify-center">
                          {firstAsset?.logo ? (
                            <Image
                              src={firstAsset.logo}
                              alt={firstAsset.ticker}
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
                            <div className="w-8 h-8 border-2 border-orange-400 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                              <span className="text-white text-xs font-bold">
                                {firstAsset?.ticker?.slice(0, 2) || 'O'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white underline truncate">
                      Others ({otherBaskts.length})
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {otherBaskts
                      .reduce((sum: number, b: any) => sum + (b.percentage || 0), 0)
                      .toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            )}
          </div>

          <BasktModal isOpen={showModal} onClose={closeModal} tradedBaskts={tradedBaskts} />
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No traded baskts yet</p>
        </div>
      )}
    </div>
  );
};
