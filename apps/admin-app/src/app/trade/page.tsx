'use client';

import { Layout } from '../../components/Layout';
import { TradingViewChart } from '../../components/market/TradingViewChart';
import { Button } from '../../components/src/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/src/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/src/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/src/tabs';
import { Input } from '../../components/src/input';
import { tradingPairs } from '../../data/market-data';
import { Shield, ChartCandlestick, TrendingUp, Bitcoin } from 'lucide-react';
import { useState } from 'react';
import { Separator } from '../../components/src/separator';
import { Badge } from '../../components/src/badge';
import { toast } from '../../hooks/use-toast';

export default function Trade() {
  const [tradeType, setTradeType] = useState('spot');
  const [leverageValue, setLeverageValue] = useState(2);
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');

  const handleTrade = (action: 'buy' | 'sell') => {
    toast({
      title: `${action === 'buy' ? 'Buy' : 'Sell'} order placed`,
      description: `Your ${action} order for ${selectedPair} has been placed successfully`,
      variant: action === 'buy' ? 'default' : 'destructive',
    });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-3/4">
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium">Trading Chart</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Tabs defaultValue="candlestick" className="w-full">
                      <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="candlestick">
                          <ChartCandlestick className="h-4 w-4 mr-2" />
                          Candlestick
                        </TabsTrigger>
                        <TabsTrigger value="line">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Line
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TradingViewChart className="h-[400px]" />
              </CardContent>
            </Card>
          </div>

          <Card className="lg:w-1/4">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium">Trade</CardTitle>
                <Select defaultValue="BTCUSDT" onValueChange={(value) => setSelectedPair(value)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Select pair" />
                  </SelectTrigger>
                  <SelectContent>
                    {tradingPairs.map((pair) => (
                      <SelectItem
                        key={`${pair.base}${pair.quote}`}
                        value={`${pair.base}${pair.quote}`}
                      >
                        <div className="flex items-center">
                          <Bitcoin className="h-4 w-4 mr-2 text-orange-500" />
                          {pair.base}/{pair.quote}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="spot"
                onValueChange={(value) => setTradeType(value)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="spot">Spot</TabsTrigger>
                  <TabsTrigger value="margin">Margin</TabsTrigger>
                </TabsList>

                {tradeType === 'margin' && (
                  <div className="py-2">
                    <p className="text-sm text-muted-foreground mb-2">Leverage</p>
                    <div className="flex space-x-1">
                      {[2, 5, 10, 25, 50].map((value) => (
                        <Badge
                          key={value}
                          variant={leverageValue === value ? 'default' : 'outline'}
                          className="cursor-pointer hover:bg-primary/90"
                          onClick={() => setLeverageValue(value)}
                        >
                          {value}x
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center mt-2">
                      <Shield className="h-4 w-4 text-yellow-500 mr-1" />
                      <p className="text-xs text-muted-foreground">
                        Higher leverage increases both risk and potential rewards
                      </p>
                    </div>
                    <Separator className="my-2" />
                  </div>
                )}

                <Tabs defaultValue="buy" className="w-full">
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="buy">Buy</TabsTrigger>
                    <TabsTrigger value="sell">Sell</TabsTrigger>
                  </TabsList>
                  <TabsContent value="buy" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Price</div>
                      <div className="relative">
                        <Input defaultValue="51283.42" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                          USDT
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Amount</div>
                      <div className="relative">
                        <Input defaultValue="0.1" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                          BTC
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="relative">
                        <Input defaultValue="5128.34" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                          USDT
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-success hover:bg-success/90"
                      onClick={() => handleTrade('buy')}
                    >
                      Buy BTC {tradeType === 'margin' && `(${leverageValue}x)`}
                    </Button>
                  </TabsContent>
                  <TabsContent value="sell" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Price</div>
                      <div className="relative">
                        <Input defaultValue="51283.42" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                          USDT
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Amount</div>
                      <div className="relative">
                        <Input defaultValue="0.1" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                          BTC
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="relative">
                        <Input defaultValue="5128.34" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                          USDT
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-destructive hover:bg-destructive/90"
                      onClick={() => handleTrade('sell')}
                    >
                      Sell BTC {tradeType === 'margin' && `(${leverageValue}x)`}
                    </Button>
                  </TabsContent>
                </Tabs>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Order Book</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 text-sm text-muted-foreground">
                  <div>Price (USDT)</div>
                  <div className="text-right">Amount (BTC)</div>
                  <div className="text-right">Total (USDT)</div>
                </div>
                <div className="space-y-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={`sell-${i}`} className="grid grid-cols-3 text-sm">
                      <div className="text-destructive">{(51283.42 + (i + 1) * 10).toFixed(2)}</div>
                      <div className="text-right">{(Math.random() * 0.5).toFixed(4)}</div>
                      <div className="text-right">
                        {(51283.42 * Math.random() * 0.5).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center font-bold text-xl py-2">51,283.42</div>
                <div className="space-y-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={`buy-${i}`} className="grid grid-cols-3 text-sm">
                      <div className="text-success">{(51283.42 - (i + 1) * 10).toFixed(2)}</div>
                      <div className="text-right">{(Math.random() * 0.5).toFixed(4)}</div>
                      <div className="text-right">
                        {(51283.42 * Math.random() * 0.5).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 text-sm text-muted-foreground">
                  <div>Price (USDT)</div>
                  <div className="text-right">Amount (BTC)</div>
                  <div className="text-right">Time</div>
                </div>
                <div className="space-y-2">
                  {[...Array(10)].map((_, i) => {
                    const isBuy = Math.random() > 0.5;
                    return (
                      <div key={`trade-${i}`} className="grid grid-cols-3 text-sm">
                        <div className={isBuy ? 'text-success' : 'text-destructive'}>
                          {(51283.42 + (Math.random() - 0.5) * 20).toFixed(2)}
                        </div>
                        <div className="text-right">{(Math.random() * 0.5).toFixed(4)}</div>
                        <div className="text-right text-muted-foreground">
                          {`${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
