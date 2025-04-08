import { Button } from '../../components/src/button';
import { Card, CardContent, CardHeader } from '../../components/src/card';
import { Baskt } from '../../types/baskt';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ArrowRightLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import Link from 'next/link';

interface BasktCardProps {
  baskt: Baskt;
  className?: string;
}

export function BasktCard({ baskt, className }: BasktCardProps) {
  const isPositive = baskt.change24h >= 0;
  const changeColor = isPositive ? 'text-success' : 'text-destructive';
  const changeSign = isPositive ? '+' : '';
  const sparklineData = baskt.sparkline.map((value, index) => ({
    value,
    index,
  }));

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          <div className="bg-primary/10 p-2 rounded-full">
            <div className="font-semibold text-primary">{baskt.name.substring(0, 2)}</div>
          </div>
          <div>
            <h3 className="font-semibold">{baskt.name}</h3>
            <p className="text-sm text-muted-foreground">{baskt.category}</p>
          </div>
        </div>
        <div className={cn('flex items-center text-sm font-medium', changeColor)}>
          {isPositive ? (
            <ChevronUp className="h-4 w-4 mr-1" />
          ) : (
            <ChevronDown className="h-4 w-4 mr-1" />
          )}
          {changeSign}
          {Math.abs(baskt.change24h).toFixed(2)}%
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="text-2xl font-bold">
          $
          {baskt.price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>

        <div className="h-16 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={`gradient-${baskt.id}`} x1="0" y1="0" x2="0" y2="1">
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
                fill={`url(#gradient-${baskt.id})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-muted-foreground">Assets: {baskt.totalAssets}</div>
          <div className="text-muted-foreground text-right">
            AUM: ${(baskt.aum / 1000000).toFixed(1)}M
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-success mr-1"></div>
            <span className="text-muted-foreground">Long</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-destructive mr-1"></div>
            <span className="text-muted-foreground">Short</span>
          </div>
          <div className="text-muted-foreground text-right">Risk: {baskt.risk}</div>
        </div>

        <Link href={`/baskts/${baskt.id}`} className="block">
          <Button className="w-full" size="sm">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Trade
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
