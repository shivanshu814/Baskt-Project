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
import { Shield, ChartCandlestick, TrendingUp, Bitcoin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Separator } from '../../components/src/separator';
import { Badge } from '../../components/src/badge';
import { toast } from '../../hooks/use-toast';
import { TradingPair, OrderBookEntry } from '../../types/baskt';
import type { Trade } from '../../types/baskt';

export default function Trade() {
  const [tradeType, setTradeType] = useState('spot');
  const [leverageValue, setLeverageValue] = useState(2);
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [orderBook, setOrderBook] = useState<{
    buys: OrderBookEntry[];
    sells: OrderBookEntry[];
    currentPrice: number;
  }>({
    buys: [],
    sells: [],
    currentPrice: 0,
  });
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTradingData = async () => {
      try {
        // TODO: Replace with actual API calls
        // const pairsResponse = await fetch('/api/market/trading-pairs');
        // const orderBookResponse = await fetch(`/api/market/order-book/${selectedPair}`);
        // const tradesResponse = await fetch(`/api/market/recent-trades/${selectedPair}`);

        // const pairsData = await pairsResponse.json();
        // const orderBookData = await orderBookResponse.json();
        // const tradesData = await tradesResponse.json();

        // setTradingPairs(pairsData);
        // setOrderBook(orderBookData);
        // setRecentTrades(tradesData);
        setTradingPairs([]);
        setOrderBook({
          buys: [],
          sells: [],
          currentPrice: 0,
        });
        setRecentTrades([]);
      } catch (error) {
        console.error('Error fetching trading data:', error); //eslint-disable-line
        toast({
          title: 'Error',
          description: 'Failed to fetch trading data. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTradingData();
  }, [selectedPair]);

  const handleTrade = (action: 'buy' | 'sell') => {
    toast({
      title: `${action === 'buy' ? 'Buy' : 'Sell'} order placed`,
      description: `Your ${action} order for ${selectedPair} has been placed successfully`,
      variant: action === 'buy' ? 'default' : 'destructive',
    });
  };

  if (isLoading) {
    return <Layout>Loading...</Layout>;
  }

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
                <TradingViewChart
                  className="h-[400px]"
                  dailyData={[]}
                  weeklyData={[]}
                  monthlyData={[]}
                  yearlyData={[]}
                />
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
                        <Input defaultValue="0" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                          USDT
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Amount</div>
                      <div className="relative">
                        <Input defaultValue="0" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                          BTC
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="relative">
                        <Input defaultValue="0" />
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
                        <Input defaultValue="0" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                          USDT
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Amount</div>
                      <div className="relative">
                        <Input defaultValue="0" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                          BTC
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="relative">
                        <Input defaultValue="0" />
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
                  {orderBook.sells.map((entry, i) => (
                    <div key={`sell-${i}`} className="grid grid-cols-3 text-sm">
                      <div className="text-destructive">{entry.price.toFixed(2)}</div>
                      <div className="text-right">{entry.amount.toFixed(4)}</div>
                      <div className="text-right">{entry.total.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <div className="text-center font-bold text-xl py-2">
                  {orderBook.currentPrice.toLocaleString()}
                </div>
                <div className="space-y-1">
                  {orderBook.buys.map((entry, i) => (
                    <div key={`buy-${i}`} className="grid grid-cols-3 text-sm">
                      <div className="text-success">{entry.price.toFixed(2)}</div>
                      <div className="text-right">{entry.amount.toFixed(4)}</div>
                      <div className="text-right">{entry.total.toFixed(2)}</div>
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
                  {recentTrades.map((trade, i) => (
                    <div key={`trade-${i}`} className="grid grid-cols-3 text-sm">
                      <div className={trade.type === 'buy' ? 'text-success' : 'text-destructive'}>
                        {trade.price.toFixed(2)}
                      </div>
                      <div className="text-right">{trade.amount.toFixed(4)}</div>
                      <div className="text-right text-muted-foreground">{trade.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
