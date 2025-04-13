import { Button } from '../../components/src/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/src/table';
import { Baskt, UserBasktPosition } from '../../types/baskt';
import { cn } from '@baskt/ui';
import { ArrowRightLeft, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/src/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/src/collapsible';
import { useState } from 'react';

interface BasktPositionsTableProps {
  positions: Array<{
    baskt: Baskt;
    position: UserBasktPosition;
  }>;
  className?: string;
}

export function BasktPositionsTable({ positions, className }: BasktPositionsTableProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Your Positions
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? 'Hide' : 'Show'}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent>
            {positions.length > 0 ? (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Baskt</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Collateral</TableHead>
                      <TableHead>Entry Price</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Open Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((item, index) => {
                      const isProfitable = item.position.pnl > 0;
                      const collateralAmount =
                        item.position.collateral || item.position.positionSize * 1.5;
                      const collateralRatio = (
                        (collateralAmount / item.position.positionSize) *
                        100
                      ).toFixed(0);
                      const positionType = item.position.type || 'long';

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.baskt.name}</TableCell>
                          <TableCell
                            className={cn(
                              'font-medium',
                              positionType === 'long' ? 'text-success' : 'text-destructive',
                            )}
                          >
                            {positionType.charAt(0).toUpperCase() + positionType.slice(1)}
                          </TableCell>
                          <TableCell>${item.position.positionSize.toLocaleString()}</TableCell>
                          <TableCell>
                            ${collateralAmount.toLocaleString()}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({collateralRatio}%)
                            </span>
                          </TableCell>
                          <TableCell>
                            $
                            {item.position.entryPrice.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell>
                            $
                            {item.position.currentValue.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'font-medium flex items-center gap-1',
                              isProfitable ? 'text-success' : 'text-destructive',
                            )}
                          >
                            {isProfitable ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            {isProfitable ? '+' : ''}$
                            {item.position.pnl.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            <span className="text-xs ml-1">
                              ({isProfitable ? '+' : ''}
                              {item.position.pnlPercentage.toFixed(2)}%)
                            </span>
                          </TableCell>
                          <TableCell>{item.position.openDate}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Link href={`/baskts/${item.baskt.id}`}>
                              <Button variant="outline" size="sm" className="h-8 px-2 py-0">
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span className="sr-only">View</span>
                              </Button>
                            </Link>
                            <Button variant="outline" size="sm" className="h-8 px-2 py-0">
                              Modify
                            </Button>
                            <Button variant="destructive" size="sm" className="h-8 px-2 py-0">
                              Close
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">You don't have any active positions.</p>
                <Link href="/baskts">
                  <Button className="mt-4">Explore Baskts</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
