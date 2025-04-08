import { BasktCard } from '../../components/baskt/BasktCard';
import { TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Baskt } from '../../types/baskt';

export function TrendingBaskts() {
  const [trendingBaskts, setTrendingBaskts] = useState<Baskt[]>([]);
  const [isLoading, setIsLoading] = useState(true); //eslint-disable-line

  useEffect(() => {
    const fetchTrendingBaskts = async () => {
      try {
        // TODO: Replace with actual API call to fetch trending baskts
        // const response = await fetch('/api/baskts/trending');
        // const data = await response.json();
        // setTrendingBaskts(data);
        setTrendingBaskts([]); // Empty array for now
      } catch (error) {
        console.error('Error fetching trending baskts:', error); // eslint-disable-line
        setTrendingBaskts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingBaskts();
  }, []);

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
