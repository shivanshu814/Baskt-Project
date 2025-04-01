import { Card, CardContent } from '../../components/src/card';
import { CryptoAsset } from '../../data/market-data';
import { cn } from '../../lib/utils';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface CryptoCardProps {
  crypto: CryptoAsset;
  className?: string;
}

export function CryptoCard({ crypto, className }: CryptoCardProps) {
  const isPositive = crypto.change24h >= 0;
  const changeColor = isPositive ? 'text-success' : 'text-destructive';
  const changeSign = isPositive ? '+' : '';

  const sparklineData = crypto.sparkline.map((value, index) => ({
    value,
    index,
  }));

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-300 hover:shadow-md hover-scale',
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="font-semibold">{crypto.symbol}</div>
            <div className="text-sm text-muted-foreground">{crypto.name}</div>
          </div>
          <div className={cn('text-sm font-medium', changeColor)}>
            {changeSign}
            {crypto.change24h.toFixed(2)}%
          </div>
        </div>
        <div className="text-2xl font-bold mb-3">
          $
          {crypto.price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div className="h-16 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={`gradient-${crypto.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                strokeWidth={2}
                fill={`url(#gradient-${crypto.id})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <div>Vol: ${(crypto.volume24h / 1000000000).toFixed(1)}B</div>
          <div>Cap: ${(crypto.marketCap / 1000000000).toFixed(1)}B</div>
        </div>
      </CardContent>
    </Card>
  );
}
