'use client';
import React from 'react';
// eslint-disable-next-line
export function MetricsGrid({ baskt }: { baskt: any }) {
  const metrics = [
    {
      label: '30D Change',
      value:
        baskt?.performance?.month !== undefined ? `+${baskt.performance.month.toFixed(2)}%` : '-',
    },
    {
      label: '24h Change',
      value: baskt?.performance?.day !== undefined ? `+${baskt.performance.day.toFixed(2)}%` : '-',
    },
    {
      label: '7D Change',
      value:
        baskt?.performance?.week !== undefined ? `+${baskt.performance.week.toFixed(2)}%` : '-',
    },
    {
      label: 'Total Assets',
      value: baskt?.totalAssets ?? '-',
    },
    {
      label: '30D Sharpe Ratio',
      value: '1.85',
    },
    {
      label: '30D Sortino Ratio',
      value: '2.12',
    },
    {
      label: '30D Volatility',
      value: '18.5%',
    },
    {
      label: '30D Return vs SOL',
      value: '+5.2%',
      valueClass: 'text-green-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 w-full max-w-2xl py-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="flex items-center space-x-2">
          <span className="text-sm font-medium text-muted-foreground">{metric.label}:</span>
          <span className={`text-base font-semibold ${metric.valueClass ?? ''}`}>
            {metric.value}
          </span>
        </div>
      ))}
    </div>
  );
}
