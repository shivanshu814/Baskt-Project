import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AssetAllocationChart } from './AssetAllocationChart';
import { Baskt } from '../../types/baskt';
import { cn } from '@baskt/ui';
import { ChevronDown, ChevronUp, ChevronsDown, ChevronsUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Button } from '../ui/button';
import { useState } from 'react';

interface BasktDetailCardProps {
  baskt: Baskt;
  className?: string;
}

export function BasktDetailCard({ baskt, className }: BasktDetailCardProps) {
  const isPositive = baskt.change24h >= 0;
  const changeColor = isPositive ? 'text-success' : 'text-destructive';
  const changeSign = isPositive ? '+' : '';

  const [isPerformanceOpen, setIsPerformanceOpen] = useState(true);
  const [isAssetsOpen, setIsAssetsOpen] = useState(true);

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">{baskt.name}</CardTitle>
            <CardDescription className="mt-1">{baskt.description}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              $
              {baskt.price.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className={cn('flex items-center justify-end mt-1', changeColor)}>
              {isPositive ? (
                <ChevronUp className="h-4 w-4 mr-1" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-1" />
              )}
              {changeSign}
              {Math.abs(baskt.change24h).toFixed(2)}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Assets</div>
                <div className="text-xl font-semibold mt-1">{baskt.totalAssets}</div>
              </div>
              <div className="bg-secondary/50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">AUM</div>
                <div className="text-xl font-semibold mt-1">
                  ${(baskt.aum / 1000000).toFixed(1)}M
                </div>
              </div>
              <div className="bg-secondary/50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Creator</div>
                <div className="text-xl font-semibold mt-1">{baskt.creator}</div>
              </div>
              <div className="bg-secondary/50 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Risk Level</div>
                <div className="text-xl font-semibold mt-1 capitalize">{baskt.risk}</div>
              </div>
            </div>

            <Collapsible open={isPerformanceOpen} onOpenChange={setIsPerformanceOpen}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Performance</h3>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isPerformanceOpen ? (
                      <ChevronsUp className="h-4 w-4" />
                    ) : (
                      <ChevronsDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  <div className="bg-secondary/50 p-3 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">24h</div>
                    <div
                      className={cn(
                        'text-lg font-semibold mt-1',
                        baskt.performance.day >= 0 ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {baskt.performance.day >= 0 ? '+' : ''}
                      {baskt.performance.day.toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-secondary/50 p-3 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">7d</div>
                    <div
                      className={cn(
                        'text-lg font-semibold mt-1',
                        baskt.performance.week >= 0 ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {baskt.performance.week >= 0 ? '+' : ''}
                      {baskt.performance.week.toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-secondary/50 p-3 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">30d</div>
                    <div
                      className={cn(
                        'text-lg font-semibold mt-1',
                        baskt.performance.month >= 0 ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {baskt.performance.month >= 0 ? '+' : ''}
                      {baskt.performance.month.toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-secondary/50 p-3 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">1y</div>
                    <div
                      className={cn(
                        'text-lg font-semibold mt-1',
                        baskt.performance.year >= 0 ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {baskt.performance.year >= 0 ? '+' : ''}
                      {baskt.performance.year.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Asset Allocation</h3>
            <AssetAllocationChart assets={baskt.assets} />
          </div>
        </div>

        <Collapsible open={isAssetsOpen} onOpenChange={setIsAssetsOpen} className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Assets</h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isAssetsOpen ? (
                  <ChevronsUp className="h-4 w-4" />
                ) : (
                  <ChevronsDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div className="overflow-x-auto mt-3">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b">
                    <th className="pb-2">Asset</th>
                    <th className="pb-2">Position</th>
                    <th className="pb-2">Weightage</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2">24h</th>
                  </tr>
                </thead>
                <tbody>
                  {baskt.assets.map((asset) => (
                    <tr key={asset.id} className="border-b">
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-primary/10 rounded-full mr-2 flex items-center justify-center">
                            <div className="font-semibold text-primary text-xs">
                              {asset.symbol.substring(0, 2)}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold">{asset.symbol}</div>
                            <div className="text-sm text-muted-foreground">{asset.name}</div>
                          </div>
                        </div>
                      </td>
                      <td
                        className={cn(
                          'py-3 font-medium',
                          asset.position === 'long' ? 'text-success' : 'text-destructive',
                        )}
                      >
                        {asset.position.charAt(0).toUpperCase() + asset.position.slice(1)}
                      </td>
                      <td className="py-3">{asset.weightage}%</td>
                      <td className="py-3">
                        $
                        {asset.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td
                        className={cn(
                          'py-3',
                          asset.change24h >= 0 ? 'text-success' : 'text-destructive',
                        )}
                      >
                        {asset.change24h >= 0 ? '+' : ''}
                        {asset.change24h.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
