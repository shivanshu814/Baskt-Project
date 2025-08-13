'use client';

import { NumberFormat } from '@baskt/ui';
import React from 'react';
import { BasktCardMetricsProps, MetricCardType } from '../../../types/baskt';

export const BasktCardMetrics = React.memo(({ metricCards }: BasktCardMetricsProps) => {
  return (
    <div className="mb-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-tertiary">Metrics</h3>
      </div>
      <div className="rounded-sm border border-border bg-muted/10 overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-muted-foreground">
            {metricCards.map((card: MetricCardType, index: number) => (
              <span
                key={card.label}
                className={`flex-1 ${
                  index === 0
                    ? 'text-left'
                    : index === metricCards.length - 1
                    ? 'text-right'
                    : 'text-center'
                }`}
              >
                {card.label}
              </span>
            ))}
          </div>
          <div className="flex items-center px-2 sm:px-3 py-2 border-t border-border bg-background/80 text-xs sm:text-sm">
            {metricCards.map((card: MetricCardType, index: number) => (
              <span
                key={card.label}
                className={`flex-1 font-semibold ${card.color || ''} ${
                  index === 0
                    ? 'text-left'
                    : index === metricCards.length - 1
                    ? 'text-right'
                    : 'text-center'
                }`}
              >
                {card.label === 'OI' ? (
                  <NumberFormat
                    value={card.value ? Number(card.value) * 1e6 : 0}
                    isPrice={true}
                    showCurrency={true}
                  />
                ) : typeof card.value === 'number' ? (
                  card.value > 0 ? (
                    `+${card.value.toFixed(2)}`
                  ) : card.value < 0 ? (
                    `${card.value.toFixed(2)}`
                  ) : (
                    card.value.toFixed(2)
                  )
                ) : (
                  card.value
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

BasktCardMetrics.displayName = 'BasktCardMetrics';
