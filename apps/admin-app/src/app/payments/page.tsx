'use client';

import { Layout } from '../../components/Layout';
import { PaymentMethod } from '../../components/payments/PaymentMethod';
import { TransactionList } from '../../components/payments/TransactionList';
import { ReferralProgram } from '../../components/payments/ReferralProgram';
import { KYCVerification } from '../../components/profile/KYCVerification';
import { Button } from '../../components/src/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/src/card';
import { CreditCard, Plus, Banknote, Coins } from 'lucide-react';
import { useTransactionData } from '../../hooks/use-transaction-data';
import { Input } from '../../components/src/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/src/tabs';

export default function Payments() {
  const { transactions } = useTransactionData();

  const paymentMethods = [
    {
      id: 'pm1',
      title: 'Credit Card',
      description: 'Visa ending in 4242',
      lastFour: '4242',
      expiryDate: '09/25',
      icon: <CreditCard className="h-5 w-5" />,
      isDefault: true,
    },
    {
      id: 'pm2',
      title: 'Bank Account',
      description: 'Chase Bank',
      lastFour: '6789',
      expiryDate: 'N/A',
      icon: <Banknote className="h-5 w-5" />,
      isDefault: false,
    },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
        </div>

        <Tabs defaultValue="deposit" className="space-y-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="deposit">Deposit Funds</TabsTrigger>
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="referral">Referral Program</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Add Funds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (USD)</label>
                    <div className="relative">
                      <Input type="number" placeholder="0.00" className="pl-8" />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Method</label>
                    <select className="w-full h-10 rounded-md border border-input bg-background px-3 py-2">
                      <option value="cc">Visa ending in 4242</option>
                      <option value="bank">Chase Bank (****6789)</option>
                      <option value="new">+ Add New Payment Method</option>
                    </select>
                  </div>
                  <Button className="w-full mt-2">
                    <Coins className="h-4 w-4 mr-2" />
                    Deposit Funds
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="methods">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <PaymentMethod
                  key={method.id}
                  title={method.title}
                  description={method.description}
                  lastFour={method.lastFour}
                  expiryDate={method.expiryDate}
                  icon={method.icon}
                  isDefault={method.isDefault}
                />
              ))}

              <Card className="flex flex-col items-center justify-center p-6 border-dashed">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium mb-1">Add Payment Method</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Add a credit card, bank account, or other payment method
                </p>
                <Button>Add Method</Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="verification">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <KYCVerification />

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Verification Benefits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Level 1 (Email & Phone)</h3>
                    <p className="text-sm text-muted-foreground">• Deposit up to $1,000 per day</p>
                    <p className="text-sm text-muted-foreground">• Withdraw up to $1,000 per day</p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Level 2 (ID Verification)</h3>
                    <p className="text-sm text-muted-foreground">• Deposit up to $10,000 per day</p>
                    <p className="text-sm text-muted-foreground">
                      • Withdraw up to $10,000 per day
                    </p>
                    <p className="text-sm text-muted-foreground">• Access to margin trading</p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Level 3 (Full Verification)</h3>
                    <p className="text-sm text-muted-foreground">• Unlimited deposits</p>
                    <p className="text-sm text-muted-foreground">
                      • Withdraw up to $100,000 per day
                    </p>
                    <p className="text-sm text-muted-foreground">
                      • Access to all platform features
                    </p>
                    <p className="text-sm text-muted-foreground">• Reduced trading fees</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="referral">
            <ReferralProgram />
          </TabsContent>
        </Tabs>

        <TransactionList transactions={transactions} title="Payment History" />
      </div>
    </Layout>
  );
}
