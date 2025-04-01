import { Card, CardContent, CardHeader, CardTitle } from '../../components/src/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/src/table';
import { popularCryptos } from '../../data/market-data';
import { cn } from '../../lib/utils';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface MarketOverviewProps {
  className?: string;
}

export function MarketOverview({ className }: MarketOverviewProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Market Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Asset</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>24h Change</TableHead>
              <TableHead className="hidden sm:table-cell">24h Volume</TableHead>
              <TableHead className="hidden md:table-cell">Market Cap</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {popularCryptos.map((crypto) => (
              <TableRow key={crypto.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{crypto.symbol}</span>
                  </div>
                </TableCell>
                <TableCell>
                  $
                  {crypto.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell>
                  <div
                    className={cn(
                      'flex items-center',
                      crypto.change24h >= 0 ? 'text-success' : 'text-destructive',
                    )}
                  >
                    {crypto.change24h >= 0 ? (
                      <ArrowUp className="mr-1 h-4 w-4" />
                    ) : (
                      <ArrowDown className="mr-1 h-4 w-4" />
                    )}
                    {Math.abs(crypto.change24h).toFixed(2)}%
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  ${(crypto.volume24h / 1000000000).toFixed(1)}B
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  ${(crypto.marketCap / 1000000000).toFixed(1)}B
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
