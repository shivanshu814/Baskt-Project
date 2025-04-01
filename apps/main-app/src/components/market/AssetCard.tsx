import { Button } from '../../components/src/button';
import { Card, CardContent, CardHeader } from '../../components/src/card';
import { ChevronDown, ChevronUp, ArrowRightLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import Link from 'next/link';

interface AssetCardProps {
  name: string;
  symbol: string;
  balance: number;
  value: number;
  change: number;
  icon?: React.ReactNode;
  className?: string;
}

export function AssetCard({
  name,
  symbol,
  balance,
  value,
  change,
  icon,
  className,
}: AssetCardProps) {
  const isPositive = change >= 0;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-full bg-primary/10">{icon}</div>
          <div>
            <h3 className="font-medium">{name}</h3>
            <p className="text-sm text-muted-foreground">{symbol}</p>
          </div>
        </div>
        <div
          className={cn(
            'flex items-center text-sm font-medium',
            isPositive ? 'text-success' : 'text-destructive',
          )}
        >
          {isPositive ? (
            <ChevronUp className="h-4 w-4 mr-1" />
          ) : (
            <ChevronDown className="h-4 w-4 mr-1" />
          )}
          {Math.abs(change).toFixed(2)}%
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <div className="flex justify-between">
            <div className="text-sm text-muted-foreground">Balance</div>
            <div className="font-medium">
              {balance} {symbol}
            </div>
          </div>
          <div className="flex justify-between">
            <div className="text-sm text-muted-foreground">Value</div>
            <div className="font-medium">${value.toLocaleString()}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button variant="outline" size="sm">
              Deposit
            </Button>
            <Button variant="outline" size="sm">
              Withdraw
            </Button>
          </div>
          <Link href="/trade">
            <Button className="w-full mt-2" size="sm">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Trade
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
