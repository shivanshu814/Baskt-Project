import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  cn,
  NumberFormat,
  PRICE_PRECISION,
} from '@baskt/ui';
import { ArrowRightLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { BasktCardProps } from '../../types/baskt';
import { useBasktOI } from '../../hooks/baskt/useBasktOI';

const DEFAULT_SPARKLINE = Array(24).fill(0);

const formatNumberWithAbbreviation = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  } else {
    return value.toFixed(3);
  }
};

export const BasktCard = ({ baskt, className }: BasktCardProps) => {
  const router = useRouter();
  const { totalOpenInterest, isLoading: oiLoading } = useBasktOI(baskt.basktId.toString());

  const { isPositive, changeColor, changeIcon, sparklineData } = useMemo(() => {
    const change24h = baskt.change24h || 0;
    const isPositive = change24h >= 0;

    return {
      isPositive,
      changeColor: isPositive ? 'text-success' : 'text-destructive',
      changeIcon: isPositive ? (
        <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
      ) : (
        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
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
      initials: baskt?.name,
    };
  }, [baskt]);

  const gradientId = `gradient-${baskt.basktId}`;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-semibold">{baskt.name || 'Unnamed Baskt'}</h3>
          </div>
        </div>
        <div className={cn('flex items-center text-xs sm:text-sm font-medium', changeColor)}>
          {changeIcon}
          <NumberFormat value={baskt.change24h} />%
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 pt-0">
        <div className="text-xl sm:text-2xl font-bold">
          <NumberFormat value={baskt.price} isPrice={true} />
        </div>

        <div className="h-12 sm:h-16 w-full">
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

        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
          <div>Assets: {baskt.totalAssets || 0}</div>
          <div className="text-right">
            OI: {oiLoading ? '...' : formatNumberWithAbbreviation(totalOpenInterest / 1e6)}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-success mr-1" />
              Long
            </div>
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-destructive mr-1" />
              Short
            </div>
          </div>
          <div>Risk: {baskt.risk || 'medium'}</div>
        </div>

        <Button
          className="w-full text-xs sm:text-sm"
          size="sm"
          onClick={() => router.push(`/baskts/${encodeURIComponent(baskt.name)}`)}
        >
          <ArrowRightLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Trade
        </Button>
      </CardContent>
    </Card>
  );
};
