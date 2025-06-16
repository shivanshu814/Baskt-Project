import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { ArrowRightLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { cn } from '@baskt/ui';
import { useMemo } from 'react';
import { BasktCardProps } from '../../types/baskt';
import { PRICE_PRECISION } from '@baskt/ui';

const DEFAULT_SPARKLINE = Array(24).fill(0);

export const BasktCard = ({ baskt, className }: BasktCardProps) => {
  const router = useRouter();

  const {
    isPositive,
    changeColor,
    changeIcon,
    formattedPrice,
    sparklineData,
    formattedAum,
    initials,
  } = useMemo(() => {
    const change24h = baskt.change24h || 0;
    const isPositive = change24h >= 0;

    return {
      isPositive,
      changeColor: isPositive ? 'text-success' : 'text-destructive',
      changeIcon: isPositive ? (
        <ChevronUp className="h-4 w-4 mr-1" />
      ) : (
        <ChevronDown className="h-4 w-4 mr-1" />
      ),
      formattedPrice: (baskt.price || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      sparklineData: (baskt.sparkline || DEFAULT_SPARKLINE).map((value, index) => ({
        value,
        index,
      })),
      formattedAum: ((baskt.aum || 0) / PRICE_PRECISION).toFixed(1),
      image: baskt?.image,
      initials: baskt?.name,
    };
  }, [baskt]);

  const gradientId = `gradient-${baskt.basktId}`;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-full">
            <img src={baskt.image} alt={initials} className="h-8 w-8 rounded-full" />
          </div>
          <div>
            <h3 className="font-semibold">{baskt.name || 'Unnamed Baskt'}</h3>
          </div>
        </div>
        <div className={cn('flex items-center text-sm font-medium', changeColor)}>
          {changeIcon}
          {`${isPositive ? '+' : ''}${Math.abs(baskt.change24h || 0).toFixed(2)}%`}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="text-2xl font-bold">${formattedPrice}</div>

        <div className="h-16 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={`hsl(var(--${isPositive ? 'success' : 'destructive'}))`}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={`hsl(var(--${isPositive ? 'success' : 'destructive'}))`}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={`hsl(var(--${isPositive ? 'success' : 'destructive'}))`}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div>Assets: {baskt.totalAssets || 0}</div>
          <div className="text-right">AUM: ${formattedAum}M</div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-success mr-1" />
            Long
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-destructive mr-1" />
            Short
          </div>
          <div className="text-right">Risk: {baskt.risk || 'medium'}</div>
        </div>

        <Button
          className="w-full"
          size="sm"
          onClick={() => router.push(`/baskts/${baskt.basktId}`)}
        >
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Trade
        </Button>
      </CardContent>
    </Card>
  );
};
