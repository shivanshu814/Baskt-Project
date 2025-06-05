import { memo } from 'react';
import { BasktCard } from './BasktCard';
import { BasktGridProps } from '../../types/baskt';

export const BasktGrid = memo(({ baskts }: BasktGridProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {baskts.map((baskt) => (
      <BasktCard
        key={baskt.basktId.toString()}
        baskt={baskt}
        className="hover:shadow-md transition-shadow"
      />
    ))}
  </div>
));
