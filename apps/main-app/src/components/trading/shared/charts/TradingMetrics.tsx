import { NumberFormat } from '@baskt/ui';
import React from 'react';
import { TradingMetricsProps } from '../../../../types/trading/orders';

export const TradingMetrics: React.FC<TradingMetricsProps> = ({
  baskt,
  totalOpenInterest,
  totalVolume,
  oiLoading,
  volumeLoading,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-6 lg:grid-cols-8 gap-4 text-sm">
      <div className="flex flex-col items-center">
        <span className="text-muted-foreground text-xs">Index Price</span>
        <span className="font-semibold text-center">
          <NumberFormat value={baskt.price || 0} isPrice={true} showCurrency={true} />
        </span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-muted-foreground text-xs">30D Change</span>
        <span
          className={`font-semibold ${
            (baskt.performance?.month || 0) >= 0 ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {(baskt.performance?.month || 0) >= 0 ? '+' : ''}
          {(baskt.performance?.month || 0).toFixed(2)}%
        </span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-muted-foreground text-xs">OI</span>
        <span className="font-semibold">
          {oiLoading ? (
            '...'
          ) : totalOpenInterest === 0 ? (
            '---'
          ) : (
            <NumberFormat value={totalOpenInterest} isPrice={true} showCurrency={true} />
          )}
        </span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-muted-foreground text-xs">24hr Change</span>
        <span
          className={`font-semibold ${
            (baskt.performance?.day || 0) >= 0 ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {(baskt.performance?.day || 0) >= 0 ? '+' : ''}
          {(baskt.performance?.day || 0).toFixed(2)}%
        </span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-muted-foreground text-xs">24hr Volume</span>
        <span className="font-semibold">
          {volumeLoading ? (
            '...'
          ) : totalVolume === 0 ? (
            '---'
          ) : (
            <NumberFormat value={totalVolume} isPrice={true} showCurrency={true} />
          )}
        </span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-muted-foreground text-xs">7D Change</span>
        <span
          className={`font-semibold ${
            (baskt.performance?.week || 0) >= 0 ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {(baskt.performance?.week || 0) >= 0 ? '+' : ''}
          {(baskt.performance?.week || 0).toFixed(2)}%
        </span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-muted-foreground text-xs">Total Assets</span>
        <span className="font-semibold">{baskt.assets?.length || 0}</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-muted-foreground text-xs">30D Volatility</span>
        <span className="text-green-500 font-semibold">18.5%</span>
      </div>
    </div>
  );
};
