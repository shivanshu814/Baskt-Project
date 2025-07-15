'use client';
import React from 'react';
import { LiquidityAllocationProps } from '../../types/pool';
import { NumberFormat, Skeleton } from '@baskt/ui';
import Image from 'next/image';
import { trpc } from '../../utils/common/trpc';

export const LiquidityAllocation = React.memo(
  ({ tvl, blpPrice, totalSupply }: LiquidityAllocationProps) => {
    const fees = 1_000;

    const actualTvl = (parseFloat(tvl.replace(/,/g, '')) / 1e6).toFixed(2);
    const actualTotalSupply = (parseFloat(totalSupply.replace(/,/g, '')) / 1e6).toFixed(2);
    
    // Fetch OI data for all assets using trpc
    const { data: oiData, isLoading } = trpc.metrics.getOpenInterestForAllAssets.useQuery();

    return (
      <div className="bg-foreground/5 border border-border rounded-2xl p-8 flex flex-col gap-6">
        <div>
          <div className="text-sm font-semibold text-foreground mb-1">Total Value Locked</div>
          <div className="text-3xl font-semibold text-primary mb-1">
            <NumberFormat value={Number(actualTvl) * 1e6} isPrice={true} />
          </div>
        </div>

        <div>
          <div className="text-base font-semibold text-foreground mb-3 mt-4">Exposure</div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-8 w-24" />
                </div>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !oiData?.success || !oiData?.data || oiData.data.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No exposure data available</div>
            ) : (
              <table className="min-w-full text-foreground/90 text-sm rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-foreground/10">
                    <th className="px-4 py-2 text-left font-medium">Asset</th>
                    <th className="px-4 py-2 text-left font-medium">Long Exposure</th>
                    <th className="px-4 py-2 text-left font-medium">Short Exposure</th>
                    <th className="px-4 py-2 text-left font-medium">Net Exposure</th>
                  </tr>
                </thead>
                <tbody>
                  {oiData.data
                    .filter(asset => asset.longOpenInterest > 0 || asset.shortOpenInterest > 0)
                    .map((asset) => {
                      const assetSymbol = asset.assetMetadata?.ticker || 'Unknown';
                      const assetImage = asset.assetMetadata?.logo || '/assets/unknown.png';
                      const longExposure = asset.longOpenInterest;
                      const shortExposure = asset.shortOpenInterest;
                      const netExposure = longExposure - shortExposure;
                      const totalExposure = longExposure + shortExposure;
                      
                      // Calculate percentages
                      const longPercentage = totalExposure > 0 ? ((longExposure / totalExposure) * 100).toFixed(2) : '0';
                      const shortPercentage = totalExposure > 0 ? ((shortExposure / totalExposure) * 100).toFixed(2) : '0';
                      
                      return (
                        <tr key={assetSymbol}>
                          <td className="px-4 py-3 flex items-center gap-3">
                            <Image
                              src={assetImage}
                              alt={assetSymbol}
                              className="w-7 h-7 rounded-full"
                              width={28}
                              height={28}
                            />
                            <div>
                              <div className="font-semibold text-foreground">{assetSymbol}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">
                              <NumberFormat value={longExposure} isPrice={true} />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {longPercentage}%
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">
                              <NumberFormat value={shortExposure} isPrice={true} />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {shortPercentage}%
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">
                              <NumberFormat value={Math.abs(netExposure)} isPrice={true} />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {netExposure >= 0 ? 'Long' : 'Short'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-foreground/10 rounded-xl p-4">
            <div className="text-sm text-muted-foreground mb-1">Fees</div>
            <div className="text-xl font-bold text-foreground">${fees.toLocaleString()}</div>
          </div>
          <div className="bg-foreground/10 rounded-xl p-4">
            <div className="text-sm text-muted-foreground mb-1">BLP Price</div>
            <div className="text-xl font-bold text-foreground">
              {isNaN(Number(blpPrice)) || !isFinite(Number(blpPrice)) ? '---' : `$${blpPrice}`}
            </div>
          </div>
          <div className="bg-foreground/10 rounded-xl p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Supply</div>
            <div className="text-xl font-bold text-foreground">
              <NumberFormat value={Number(actualTotalSupply) * 1e6} isPrice={true} />
            </div>
          </div>
        </div>
      </div>
    );
  },
);

LiquidityAllocation.displayName = 'LiquidityAllocation';
