import { BasktCard } from '../../components/baskt/BasktCard';
import { popularBaskts } from '../../data/baskts-data';
import { TrendingUp } from 'lucide-react';

export function TrendingBaskts() {
  // Get top 4 trending baskts
  const trendingBaskts = popularBaskts.slice(0, 4);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Trending Baskts</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {trendingBaskts.map((baskt) => (
          <BasktCard
            key={baskt.id}
            baskt={baskt}
            className="hover:shadow-md transition-shadow h-full"
          />
        ))}
      </div>
    </div>
  );
}
