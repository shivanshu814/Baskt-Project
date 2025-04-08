import { Button } from '../../components/src/button';
import { Card, CardContent, CardHeader } from '../../components/src/card';
import { Baskt, UserBasktPosition } from '../../types/baskt';
import { cn } from '../../lib/utils';
import { ArrowRightLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface BasktPositionCardProps {
  baskt: Baskt;
  position: UserBasktPosition;
  className?: string;
}

export function BasktPositionCard({ baskt, position, className }: BasktPositionCardProps) {
  const isProfitable = position.pnl > 0;

  return (
    <Card className={cn('overflow-hidden', className)}>
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
        <div
          className={cn(
            'flex items-center text-sm font-medium',
            isProfitable ? 'text-success' : 'text-destructive',
          )}
        >
          {isProfitable ? (
            <ChevronUp className="h-4 w-4 mr-1" />
          ) : (
            <ChevronDown className="h-4 w-4 mr-1" />
          )}
          {isProfitable ? '+' : ''}
          {position.pnlPercentage.toFixed(2)}%
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <div className="flex justify-between">
            <div className="text-sm text-muted-foreground">Current Value</div>
            <div className="font-semibold">
              $
              {position.currentValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="flex justify-between">
            <div className="text-sm text-muted-foreground">Position Size</div>
            <div className="font-medium">${position.positionSize.toLocaleString()}</div>
          </div>
          <div className="flex justify-between">
            <div className="text-sm text-muted-foreground">Entry Price</div>
            <div className="font-medium">
              $
              {position.entryPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="flex justify-between">
            <div className="text-sm text-muted-foreground">P&L</div>
            <div
              className={cn('font-semibold', isProfitable ? 'text-success' : 'text-destructive')}
            >
              {isProfitable ? '+' : ''}$
              {position.pnl.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="flex justify-between">
            <div className="text-sm text-muted-foreground">Open Date</div>
            <div className="font-medium">{position.openDate}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <Link href={`/baskts/${baskt.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                View
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="w-full text-destructive">
              Close
            </Button>
          </div>

          <Link href={`/trade-baskt/${baskt.id}`}>
            <Button className="w-full mt-1" size="sm">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Modify Position
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
