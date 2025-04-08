import { Card, CardContent, CardHeader, CardTitle } from '../../components/src/card';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';
import { Asset, UserBasktPosition } from '../../types/baskt';
import { toast } from '../../hooks/use-toast';
import { Button } from '../../components/src/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/src/table';

interface PortfolioSummaryProps {
  className?: string;
}

interface PortfolioData {
  totalValue: number;
  change24h: number;
  assets: Asset[];
  positions: UserBasktPosition[];
}

export function PortfolioSummary({ className }: PortfolioSummaryProps) {
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    totalValue: 0,
    change24h: 0,
    assets: [],
    positions: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch('/api/portfolio/summary');
        // const data = await response.json();
        // setPortfolio(data);
        setPortfolio({
          totalValue: 0,
          change24h: 0,
          assets: [],
          positions: [],
        });
      } catch (error) {
        console.error('Error fetching portfolio data:', error); //eslint-disable-line
        toast({
          title: 'Error',
          description: 'Failed to fetch portfolio data. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolioData();
  }, []);

  if (isLoading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading portfolio data...</div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = portfolio.change24h >= 0;
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
                {portfolio.totalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className={cn('text-sm font-medium', changeColor)}>
                {changeSign}
                {portfolio.change24h.toFixed(2)}% (24h)
              </div>
            </div>
            <Button variant="outline" className="whitespace-nowrap">
              View Details
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-secondary/30 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Total Assets</div>
              <div className="text-lg font-medium">{portfolio.assets.length}</div>
            </div>
            <div className="bg-secondary/30 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Total Trades</div>
              <div className="text-lg font-medium">{portfolio.positions.length}</div>
            </div>
            <div className="bg-secondary/30 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Unrealized P&L</div>
              <div
                className={`text-lg font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}
              >
                {changeSign}$
                {Math.abs((portfolio.change24h * portfolio.totalValue) / 100).toFixed(2)}
              </div>
            </div>
            <div className="bg-secondary/30 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Active Positions</div>
              <div className="text-lg font-medium">{portfolio.positions.length}</div>
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
                {portfolio.assets.slice(0, 5).map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.symbol}</TableCell>
                    <TableCell className="text-right">
                      {(asset.allocation || 0).toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${((asset.allocation || 0) * asset.price).toLocaleString()}
                    </TableCell>
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
