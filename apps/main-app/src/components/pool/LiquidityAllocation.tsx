'use client';
import React from 'react';
import { LiquidityAllocationProps } from '../../types/pool';

export const LiquidityAllocation = React.memo(
  ({ tvl, allocations, blpPrice, totalSupply }: LiquidityAllocationProps) => {
    // Calculate fees (previously Total USDC) from allocations
    const fees = 1_000;

    // Convert TVL and Total Supply from 1e6 scale to actual values
    const actualTvl = (parseFloat(tvl.replace(/,/g, '')) / 1e6).toFixed(2);
    const actualTotalSupply = (parseFloat(totalSupply.replace(/,/g, '')) / 1e6).toFixed(2);

    return (
      <div className="bg-foreground/5 border border-border rounded-2xl p-8 flex flex-col gap-6">
        <div>
          <div className="text-sm font-semibold text-foreground mb-1">Total Value Locked</div>
          <div className="text-3xl font-semibold text-primary mb-1">${actualTvl}</div>
        </div>

        <div>
          <div className="text-base font-semibold text-foreground mb-3 mt-4">Exposure</div>
          <div className="overflow-x-auto">
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
                {allocations.map((token) => (
                  <tr key={token.symbol}>
                    <td className="px-4 py-3 flex items-center gap-3">
                      <img src={token.image} alt={token.symbol} className="w-7 h-7 rounded-full" />
                      <div>
                        <div className="font-semibold text-foreground">{token.symbol}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">${token.longExposure.usd}</div>
                      <div className="text-xs text-muted-foreground">
                        {token.longExposure.percentage}%
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">
                        ${token.shortExposure.usd}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {token.shortExposure.percentage}%
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">${token.poolSize.usd}</div>
                      <div className="text-xs text-muted-foreground">
                        {token.weightage.current}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <div className="text-xl font-bold text-foreground">{actualTotalSupply}</div>
          </div>
        </div>
      </div>
    );
  },
);

LiquidityAllocation.displayName = 'LiquidityAllocation';
