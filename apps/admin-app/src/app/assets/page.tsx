'use client';

import { Layout } from '../../components/Layout';
import { AssetCard } from '../../components/market/AssetCard';
import { TransactionList } from '../../components/payments/TransactionList';
import { Button } from '../../components/src/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/src/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/src/tabs';
import { useTransactionData } from '../../hooks/use-transaction-data';
import { Bitcoin, Coins, Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '../../components/src/input';

export default function Assets() {
  const { transactions } = useTransactionData();

  const assets = [
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      balance: 0.5421,
      value: 27850.42,
      change: 2.3,
      icon: <Bitcoin className="h-5 w-5 text-orange-500" />,
    },
    {
      name: 'Ethereum',
      symbol: 'ETH',
      balance: 4.2098,
      value: 9578.3,
      change: -1.7,
      icon: <Coins className="h-5 w-5 text-purple-500" />,
    },
    {
      name: 'Solana',
      symbol: 'SOL',
      balance: 45.75,
      value: 2975.82,
      change: 5.2,
      icon: <Coins className="h-5 w-5 text-blue-500" />,
    },
    {
      name: 'Cardano',
      symbol: 'ADA',
      balance: 2150.35,
      value: 1204.68,
      change: -0.8,
      icon: <Coins className="h-5 w-5 text-teal-500" />,
    },
    {
      name: 'Polkadot',
      symbol: 'DOT',
      balance: 320.18,
      value: 1562.12,
      change: 3.4,
      icon: <Coins className="h-5 w-5 text-pink-500" />,
    },
    {
      name: 'Ripple',
      symbol: 'XRP',
      balance: 5480.65,
      value: 3180.5,
      change: 1.2,
      icon: <Coins className="h-5 w-5 text-cyan-500" />,
    },
  ];

  // Calculate total portfolio value
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search assets..." className="pl-9" />
            </div>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="sr-only">Filter</span>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Portfolio Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Value</div>
                <div className="text-3xl font-bold">${totalValue.toLocaleString()}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-primary/5">
                  <div className="text-sm text-muted-foreground">Assets</div>
                  <div className="text-xl font-bold">{assets.length}</div>
                </div>
                <div className="p-4 rounded-lg bg-primary/5">
                  <div className="text-sm text-muted-foreground">24h Change</div>
                  <div className="text-xl font-bold text-success">+2.5%</div>
                </div>
                <div className="p-4 rounded-lg bg-primary/5">
                  <div className="text-sm text-muted-foreground">Estimated Balance</div>
                  <div className="text-xl font-bold">$46,351.84</div>
                </div>
                <div className="p-4 rounded-lg bg-primary/5">
                  <div className="text-sm text-muted-foreground">Return</div>
                  <div className="text-xl font-bold text-success">+$1,205.32</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Assets</TabsTrigger>
            <TabsTrigger value="tokens">ETFs</TabsTrigger>
            <TabsTrigger value="nft">NFTs</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.symbol}
                  name={asset.name}
                  symbol={asset.symbol}
                  balance={asset.balance}
                  value={asset.value}
                  change={asset.change}
                  icon={asset.icon}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="tokens" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.symbol}
                  name={asset.name}
                  symbol={asset.symbol}
                  balance={asset.balance}
                  value={asset.value}
                  change={asset.change}
                  icon={asset.icon}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="nft" className="mt-4">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Coins className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-medium">No NFTs Found</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                You don't have any NFTs in your portfolio yet. Explore the NFT marketplace to get
                started.
              </p>
              <Button className="mt-4">Explore NFT Marketplace</Button>
            </div>
          </TabsContent>
        </Tabs>

        <TransactionList transactions={transactions} title="Recent Transactions" />
      </div>
    </Layout>
  );
}
