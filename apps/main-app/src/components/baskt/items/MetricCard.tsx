'use client';

import React from 'react';
import { MetricCardProps } from '../../../types/baskt';

export const MetricCard = React.memo(({ card }: MetricCardProps) => (
  <div
    className="flex-1 min-w-[110px] max-w-[180px] flex flex-col items-center bg-muted/30 rounded-md px-2 sm:px-3 py-2 text-center"
    style={{ flexBasis: '120px' }}
  >
    <span className="text-xs sm:text-xs text-muted-foreground">{card.label}</span>
    <span className={`font-semibold text-xs sm:text-sm ${card.color || ''}`}>{card.value}</span>
  </div>
));

MetricCard.displayName = 'MetricCard';
