import { Card, CardContent, CardHeader, CardTitle } from '../../components/src/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/src/table';
import { cn } from '../../lib/utils';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Asset } from '../../types/baskt';
import { toast } from '../../hooks/use-toast';

interface MarketOverviewProps {
  className?: string;
}

export function MarketOverview({ className }: MarketOverviewProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch('/api/market/assets');
        // const data = await response.json();
        // setAssets(data);
        setAssets([]);
      } catch (error) {
        console.error('Error fetching market data:', error); //eslint-disable-line
        toast({
          title: 'Error',
          description: 'Failed to fetch market data. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketData();
  }, []);

  if (isLoading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading market data...</div>
        </CardContent>
      </Card>
    );
  }

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
            {assets.map((asset) => (
              <TableRow key={asset.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{asset.symbol}</span>
                  </div>
                </TableCell>
                <TableCell>
                  $
                  {asset.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell>
                  <div
                    className={cn(
                      'flex items-center',
                      asset.change24h >= 0 ? 'text-success' : 'text-destructive',
                    )}
                  >
                    {asset.change24h >= 0 ? (
                      <ArrowUp className="mr-1 h-4 w-4" />
                    ) : (
                      <ArrowDown className="mr-1 h-4 w-4" />
                    )}
                    {Math.abs(asset.change24h).toFixed(2)}%
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  ${(asset.volume24h / 1000000000).toFixed(1)}B
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  ${(asset.marketCap / 1000000000).toFixed(1)}B
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
