import { Card, CardContent } from '../../components/src/card';
import { cn } from '../../lib/utils';
import { TrendingUp, DollarSign, BarChart } from 'lucide-react';

interface MarketTrendProps {
  id: string;
  title: string;
  asset: string;
  change?: string;
  volume?: string;
  searches?: string;
  className?: string;
}

export function MarketTrend({
  id,
  title,
  asset,
  change,
  volume,
  searches,
  className,
}: MarketTrendProps) {
  const renderIcon = () => {
    switch (id) {
      case 'gainer':
        return <TrendingUp className="h-5 w-5 text-success" />;
      case 'volume':
        return <DollarSign className="h-5 w-5 text-primary" />;
      case 'trending':
        return <BarChart className="h-5 w-5 text-warning" />;
      default:
        return null;
    }
  };

  const renderValue = () => {
    if (change) return change;
    if (volume) return volume;
    if (searches) return searches;
    return '';
  };

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-300 hover:shadow-md hover-scale',
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {renderIcon()}
          <div className="text-sm font-medium">{title}</div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-xl font-bold">{asset}</div>
          <div className="text-sm font-medium">{renderValue()}</div>
        </div>
      </CardContent>
    </Card>
  );
}
