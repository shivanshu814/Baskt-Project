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
import { ArrowRightLeft, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
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
    const change24h = baskt?.performance?.day || baskt.change24h || 0;
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
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h3 className="text-lg sm:text-xl font-bold">{baskt.name || 'Unnamed Baskt'}</h3>
            {baskt.description && (
              <p className="text-sm text-muted-foreground mt-1">{baskt.description}</p>
            )}
          </div>
        </div>
        <div className={cn('flex items-center text-sm font-medium', changeColor)}>
          {changeIcon}
          <NumberFormat value={baskt?.performance?.day || 0} />%
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-0">
        {/* Price and Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="text-2xl sm:text-3xl font-bold">
              <NumberFormat value={baskt.price} isPrice={true} />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">AUM</div>
                <div className="font-semibold">${formatNumberWithAbbreviation((baskt.aum || 0) / PRICE_PRECISION)}</div>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Assets</div>
                <div className="font-semibold">{baskt.totalAssets || 0}</div>
              </div>
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">OI</div>
                <div className="font-semibold">
                  {oiLoading ? '...' : formatNumberWithAbbreviation(totalOpenInterest / 1e6)}
                </div>
              </div>
            </div>
          </div>

          <div className="h-32 w-full">
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
        </div>

        {/* Performance Metrics */}
        {baskt.performance && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/10 rounded-lg">
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">24h</div>
              <div className={cn('font-semibold', baskt.performance.day >= 0 ? 'text-success' : 'text-destructive')}>
                {baskt.performance.day ? `${baskt.performance.day >= 0 ? '+' : ''}${baskt.performance.day}%` : '-'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">7d</div>
              <div className={cn('font-semibold', baskt.performance.week >= 0 ? 'text-success' : 'text-destructive')}>
                {baskt.performance.week ? `${baskt.performance.week >= 0 ? '+' : ''}${baskt.performance.week}%` : '-'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">30d</div>
              <div className={cn('font-semibold', baskt.performance.month >= 0 ? 'text-success' : 'text-destructive')}>
                {baskt.performance.month ? `${baskt.performance.month >= 0 ? '+' : ''}${baskt.performance.month}%` : '-'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground mb-1">Sharpe</div>
              <div className="font-semibold">{baskt.sharpeRatio || '1.2'}</div>
            </div>
          </div>
        )}

        {/* Asset Composition */}
        {baskt.assets && baskt.assets.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <h4 className="font-semibold">Asset Composition</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {baskt.assets.slice(0, 6).map((asset, index) => (
                <div key={asset.ticker || index} className="flex items-center justify-between p-2 bg-muted/10 rounded">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      asset.direction ? 'bg-success' : 'bg-destructive'
                    )} />
                    <span className="text-sm font-medium">{asset.ticker || asset.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {asset.weight ? `${(asset.weight / 100).toFixed(1)}%` : '-'}
                  </div>
                </div>
              ))}
              {baskt.assets.length > 6 && (
                <div className="text-sm text-muted-foreground p-2">
                  +{baskt.assets.length - 6} more assets
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trading Options */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span>Long</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span>Short</span>
            </div>
          </div>
          
          <Button
            size="sm"
            onClick={() => router.push(`/baskts/${encodeURIComponent(baskt.name)}`)}
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Trade
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
