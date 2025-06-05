import React from 'react';
import { Info } from 'lucide-react';
import { LiquidityAllocationProps } from '../../types/pool';

export const LiquidityAllocation = React.memo(
  ({ tvl, aumLimit, allocations, blpPrice, totalSupply }: LiquidityAllocationProps) => {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-6">
        <div>
          <div className="text-sm font-semibold text-white mb-1">Total Value Locked</div>
          <div className="text-3xl font-semibold text-primary mb-1">${tvl}</div>
          <div className="text-xs text-white/50">AUM limit: ${aumLimit}</div>
        </div>
        <div>
          <div className="text-base font-semibold text-white mb-3 mt-4">Liquidity Allocation</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-white/90 text-sm rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-white/10">
                  <th className="px-4 py-2 text-left font-medium">Token</th>
                  <th className="px-4 py-2 text-left font-medium">Pool Size</th>
                  <th className="px-4 py-2 text-left font-medium">
                    <span className="flex items-center gap-1">
                      Current / Target Weightage
                      <Info className="h-4 w-4 text-white/40" />
                    </span>
                  </th>
                  <th className="px-4 py-2 text-left font-medium">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((token) => (
                  <tr key={token.symbol}>
                    <td className="px-4 py-3 flex items-center gap-3">
                      <img src={token.image} alt={token.symbol} className="w-7 h-7 rounded-full" />
                      <div>
                        <div className="font-semibold text-white">{token.symbol}</div>
                        <div className="text-xs text-white/50">{token.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">${token.poolSize.usd}</div>
                      <div className="text-xs text-white/50">{token.poolSize.amount}</div>
                    </td>
                    <td className="px-4 py-3">
                      {token.weightage.current}% / {token.weightage.target}%
                    </td>
                    <td className="px-4 py-3">{token.utilization}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-6">
          <div className="flex flex-row items-center justify-between w-full">
            <span className="text-white/60 text-sm">BLP Price</span>
            <span className="text-sm font-bold text-white">${blpPrice}</span>
          </div>
          <div className="flex flex-row items-center justify-between w-full">
            <span className="text-white/60 text-sm">Total Supply</span>
            <span className="text-sm font-bold text-white">{totalSupply} BLP</span>
          </div>
        </div>
      </div>
    );
  },
);

LiquidityAllocation.displayName = 'LiquidityAllocation';
