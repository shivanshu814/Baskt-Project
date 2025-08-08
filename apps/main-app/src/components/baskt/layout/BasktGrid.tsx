'use client';

import { memo } from 'react';
import { BasktGridProps } from '../../../types/baskt';
import { BasktCard } from '../card/BasktCard';

export const BasktGrid = memo(({ baskts }: BasktGridProps) => (
  <div className="space-y-6">
    {baskts.map((baskt) => (
      <BasktCard
        key={baskt.basktId.toString()}
        baskt={baskt}
        className="hover:shadow-lg transition-all duration-200"
      />
    ))}
  </div>
));
