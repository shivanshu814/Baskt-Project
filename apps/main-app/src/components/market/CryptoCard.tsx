import { Card, CardContent, CardHeader, CardTitle } from '../src/card';
import { CryptoAsset } from '../../types/baskt';
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{crypto.symbol}</CardTitle>
        <div className={`text-sm ${changeColor}`}>
          {changeSign}
          {crypto.change24h.toFixed(2)}%
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">${crypto.price.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">
          Volume: ${crypto.volume24h.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground">
          Market Cap: ${crypto.marketCap.toLocaleString()}
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
      </CardContent>
    </Card>
  );
}
