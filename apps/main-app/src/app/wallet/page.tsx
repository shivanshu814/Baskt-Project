'use client';

import { Layout } from '../../components/Layout';
import { TransactionList } from '../../components/payments/TransactionList';
import { WalletCard } from '../../components/wallet/WalletCard';
import { SecurityFeatures } from '../../components/wallet/SecurityFeatures';
import { Button } from '../../components/src/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/src/card';
import { Input } from '../../components/src/input';
import {
  Plus,
  Send,
  QrCode,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useTransactionData } from '../../hooks/use-transaction-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/src/tabs';
import { Badge } from '../../components/src/badge';

export default function Wallet() {
  const { transactions } = useTransactionData();

  const wallets = [
    {
      title: 'Bitcoin Wallet',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      balance: 0.5421,
      symbol: 'BTC',
      isMultiSig: true,
    },
    {
      title: 'Ethereum Wallet',
      address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      balance: 4.2098,
      symbol: 'ETH',
      isMultiSig: false,
    },
    {
      title: 'Solana Wallet',
      address: '7keGbP4mCXztzVW6L6zGzDcnvB8nPzTvTJPFZsKygKMd',
      balance: 45.75,
      symbol: 'SOL',
      isMultiSig: false,
    },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Wallet
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 py-2"
              >
                <ArrowDownToLine className="h-6 w-6 mb-2" />
                <span>Deposit</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 py-2"
              >
                <ArrowUpFromLine className="h-6 w-6 mb-2" />
                <span>Withdraw</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 py-2"
              >
                <Send className="h-6 w-6 mb-2" />
                <span>Send</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center h-24 py-2"
              >
                <QrCode className="h-6 w-6 mb-2" />
                <span>Scan QR</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="wallets" className="space-y-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="wallets">My Wallets</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="multisig">Multi-Signature</TabsTrigger>
          </TabsList>

          <TabsContent value="wallets" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map((wallet) => (
                <WalletCard
                  key={wallet.address}
                  title={wallet.title}
                  address={wallet.address}
                  balance={wallet.balance}
                  symbol={wallet.symbol}
                  className="relative"
                >
                  {wallet.isMultiSig && (
                    <Badge variant="secondary" className="absolute top-3 right-3 flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      Multi-Sig
                    </Badge>
                  )}
                </WalletCard>
              ))}
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Send Crypto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Wallet Address</label>
                    <Input placeholder="Enter recipient's wallet address" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Asset</label>
                      <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2">
                        <option value="btc">Bitcoin (BTC)</option>
                        <option value="eth">Ethereum (ETH)</option>
                        <option value="sol">Solana (SOL)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount</label>
                      <Input type="number" placeholder="0.00" />
                    </div>
                  </div>
                  <Button className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <SecurityFeatures />
          </TabsContent>

          <TabsContent value="multisig" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
                  Multi-Signature Wallets
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Enhance security by requiring multiple signatures for transactions
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Active Multi-Sig Wallet
                  </h3>
                  <p className="text-sm mb-2">Bitcoin Multi-Signature (2-of-3)</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Address:</span>
                      <span className="font-mono">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Required Signatures:</span>
                      <span>2 of 3</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Co-signers:</span>
                      <span>You + 2 others</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button variant="default" size="sm" className="flex-1">
                      Create Transaction
                    </Button>
                  </div>
                </div>

                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Multi-Sig Wallet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <TransactionList transactions={transactions} title="Recent Transactions" />
      </div>
    </Layout>
  );
}
