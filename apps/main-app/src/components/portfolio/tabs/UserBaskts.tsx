'use client';

import { NumberFormat } from '@baskt/ui';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../../routes/route';
import { UserBasktsProps } from '../../../types/portfolio';

const renderDailyChange = (dailyChange: number) => {
  const formattedChange = dailyChange.toFixed(2);

  if (dailyChange === 0) {
    return <span className="text-sm font-medium text-muted-foreground">0.00%</span>;
  }

  const color = dailyChange > 0 ? 'text-green-500' : 'text-red-500';
  const sign = dailyChange > 0 ? '+' : '';

  return (
    <span className={`text-sm font-medium ${color}`}>
      {sign}
      {formattedChange}%
    </span>
  );
};

export const UserBaskts = ({ userBaskts }: UserBasktsProps) => {
  const router = useRouter();

  if (!userBaskts || userBaskts.length === 0) {
    return (
      <div className="text-center py-2">
        <div className="p-8">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">No Baskts Created</h3>
          <p className="text-muted-foreground">
            You haven't created any baskts yet. Start creating your first basket to see it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {userBaskts.map((baskt: any, index: number) => (
          <div
            key={baskt.basktId || index}
            className="bg-card border border-border rounded-lg p-4 hover:bg-secondary/50 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0 group">
                <h4
                  className="font-medium text-card-foreground truncate hover:underline cursor-pointer group-hover:underline"
                  onClick={() => router.push(`${ROUTES.TRADE}/${baskt.basktId}`)}
                >
                  {baskt.baskt.name}
                </h4>
                <button
                  onClick={() => router.push(`${ROUTES.TRADE}/${baskt.basktId}`)}
                  className="flex-shrink-0 p-1 hover:bg-primary/10 rounded-md transition-colors duration-200"
                  title="Trade this baskt"
                >
                  <ExternalLink className="h-4 w-4 text-primary" />
                </button>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex-shrink-0">
                {baskt.assets.length || 0} assets
              </span>
            </div>

            <div className="flex items-center mb-3">
              <div className="flex -space-x-2">
                {baskt.assets?.slice(0, 4).map((asset: any, i: number) => (
                  <div key={i} className="relative w-8 h-8 flex items-center justify-center">
                    {asset?.logo ? (
                      <Image
                        src={asset.logo}
                        alt={asset.ticker}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover border border-border"
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
                      <div className="w-8 h-8 border border-border rounded-full flex items-center justify-center bg-secondary">
                        <span className="text-secondary-foreground text-xs font-bold">
                          {asset?.ticker?.slice(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Price:</span>
                <span className="text-sm font-medium text-card-foreground">
                  <NumberFormat
                    value={baskt.metrics.currentNav || 0}
                    isPrice={true}
                    showCurrency={true}
                  />
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">24h Change:</span>
                {renderDailyChange(baskt.metrics.performance.daily ?? 0)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
