import { Card, CardContent, CardHeader, CardTitle } from '../../components/src/card';
import { userPortfolio } from '../../data/market-data';
import { cn } from '../../lib/utils';

interface PortfolioSummaryProps {
  className?: string;
}

export function PortfolioSummary({ className }: PortfolioSummaryProps) {
  const isPositive = userPortfolio.change24h >= 0;
  const changeColor = isPositive ? 'text-success' : 'text-destructive';
  const changeSign = isPositive ? '+' : '';

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Portfolio Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-3xl font-bold">
                $
                {userPortfolio.totalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className={cn('text-sm font-medium', changeColor)}>
                {changeSign}
                {userPortfolio.change24h.toFixed(2)}% (24h)
              </div>
            </div>
            <Button variant="outline" className="whitespace-nowrap">
              View Details
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-secondary/30 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Total Assets</div>
              <div className="text-lg font-medium">{userPortfolio.assets.length}</div>
            </div>
            <div className="bg-secondary/30 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Total Trades</div>
              <div className="text-lg font-medium">54</div>
            </div>
            <div className="bg-secondary/30 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Unrealized P&L</div>
              <div
                className={`text-lg font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}
              >
                {changeSign}$1,234.56
              </div>
            </div>
            <div className="bg-secondary/30 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Active Positions</div>
              <div className="text-lg font-medium">4</div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userPortfolio.assets.slice(0, 5).map((asset) => (
                  <TableRow key={asset.symbol}>
                    <TableCell className="font-medium">{asset.symbol}</TableCell>
                    <TableCell className="text-right">{asset.amount.toFixed(4)}</TableCell>
                    <TableCell className="text-right">${asset.value.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Add missing imports
import { Button } from '../../components/src/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/src/table';
