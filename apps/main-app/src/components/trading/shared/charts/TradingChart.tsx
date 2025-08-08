'use client';

import { ChartCandlestick, Coins } from 'lucide-react';
import { useState } from 'react';
import { TradingChartProps } from '../../../../types/trading/orders';

export function TradingChart({ baskt }: TradingChartProps) {
  const [mobileTab, setMobileTab] = useState<'markets' | 'trade'>('markets');

  return (
    <>
      <div className="sm:hidden flex gap-1 mt-1 mx-1 -ml-0.5 mb-1">
        <button
          onClick={() => {
            setMobileTab('markets');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-sm text-sm font-medium transition-colors ${
            mobileTab === 'markets' ? 'bg-primary text-white' : 'bg-zinc-800 text-muted-foreground'
          }`}
        >
          <div className="w-4 h-4">
            <ChartCandlestick height={16} width={16} />
          </div>
          <span>Markets</span>
        </button>
        <button
          onClick={() => {
            setMobileTab('trade');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-sm text-sm font-medium transition-colors ${
            mobileTab === 'trade' ? 'bg-primary text-white' : 'bg-zinc-800 text-muted-foreground'
          }`}
        >
          <div className="w-4 h-4">
            <Coins height={16} width={16} />
          </div>
          <span>Trade</span>
        </button>
      </div>

      <div className={`py-0 ${mobileTab === 'trade' ? 'hidden sm:block' : ''}`}>
        <div className="mt-1 bg-zinc-900/80 border border-border rounded-sm h-[376px] sm:h-[400px] lg:h-[560px] flex flex-col">
          <div className="flex-1 flex items-center justify-center relative">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-500 text-2xl">
                  <ChartCandlestick size={24} />
                </span>
              </div>
              <p className="text-muted-foreground mb-2">Chart Component</p>
              <p className="text-xs text-muted-foreground">
                Interactive price and volume data coming soon
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
