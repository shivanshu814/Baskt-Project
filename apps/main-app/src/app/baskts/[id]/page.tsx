'use client';

import { Layout } from '../../../components/Layout';
import { BasktTradingForm } from '../../../components/baskt/BasktTradingForm';
import { TradingViewChart } from '../../../components/market/TradingViewChart';
import { Button } from '../../../components/src/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/src/card';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { IndexComposition } from '../../../components/baskt/IndexComposition';
import { CreateBasktDialog } from '../../../components/baskt/CreateBasktDialog';
import { useState, useEffect } from 'react';
import { Baskt, UserBasktPosition } from '../../../types/baskt';

export default function BasktDetailPage() {
  const router = useRouter();
  const params = useParams();
  const basktId = params.id as string;
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [baskt, setBaskt] = useState<Baskt | null>(null);
  const [userPosition, setUserPosition] = useState<UserBasktPosition | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBasktData = async () => {
      try {
        // TODO: Replace with actual API calls
        // const basktResponse = await fetch(`/api/baskts/${basktId}`);
        // const basktData = await basktResponse.json();
        // const positionResponse = await fetch(`/api/portfolio/positions/${basktId}`);
        // const positionData = await positionResponse.json();

        // setBaskt(basktData);
        // setUserPosition(positionData);
        setBaskt(null);
        setUserPosition(null);
      } catch (error) {
        console.error('Error fetching baskt data:', error); //eslint-disable-line
        setBaskt(null);
        setUserPosition(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBasktData();
  }, [basktId]);

  if (isLoading) {
    return <Layout>Loading...</Layout>;
  }

  if (!baskt) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-2xl font-bold mb-2">Baskt not found</h2>
          <p className="text-muted-foreground mb-4">
            The baskt you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push('/baskts')}>Back to Baskts</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={() => router.push('/baskts')}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
          </div>

          <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-1">
            <PlusCircle className="h-4 w-4" />
            <span>Create Baskt</span>
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left column - Baskt info */}
          <div className="col-span-3">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm text-muted-foreground">Creator</h3>
                    <p className="font-bold text-md">{baskt.creator}</p>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm text-muted-foreground">Risk Level</h3>
                    <p className="font-bold text-md capitalize">{baskt.risk}</p>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm text-muted-foreground">Category</h3>
                    <p className="font-bold text-md">{baskt.category}</p>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm text-muted-foreground">Total Assets</h3>
                    <p className="font-bold text-md">{baskt.totalAssets}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-sm text-muted-foreground mb-2">Description</h3>
                  <p className="text-sm">{baskt.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle column - Baskt name/price, Chart, Composition, Position */}
          <div className="col-span-6 space-y-6">
            {/* Baskt name and price header with logo on left, price on right */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <div className="font-semibold text-primary text-xl">
                    {baskt.name.substring(0, 2)}
                  </div>
                </div>
                <h1 className="text-2xl font-bold">{baskt.name}</h1>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">${baskt.price.toLocaleString()}</div>
                <p
                  className={`text-sm ${baskt.change24h >= 0 ? 'text-success' : 'text-destructive'}`}
                >
                  {baskt.change24h >= 0 ? '+' : ''}
                  {baskt.change24h.toFixed(2)}% (24h)
                </p>
              </div>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Price Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <TradingViewChart
                  className="h-[300px]"
                  dailyData={baskt.priceHistory?.daily || []}
                  weeklyData={baskt.priceHistory?.weekly || []}
                  monthlyData={baskt.priceHistory?.monthly || []}
                  yearlyData={baskt.priceHistory?.yearly || []}
                />
              </CardContent>
            </Card>

            {/* Index composition */}
            <IndexComposition />

            {/* User position card - always show this section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Your Position</CardTitle>
              </CardHeader>
              <CardContent>
                {userPosition ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Collateral</span>
                      <span className="font-medium">
                        $
                        {(
                          userPosition.collateral || userPosition.positionSize * 1.5
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Position Type</span>
                      <span
                        className={`font-medium ${(userPosition.type || 'long') === 'long' ? 'text-success' : 'text-destructive'}`}
                      >
                        {userPosition.type
                          ? userPosition.type.charAt(0).toUpperCase() + userPosition.type.slice(1)
                          : 'Long'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Entry Price</span>
                      <span className="font-medium">${userPosition.entryPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Current Value</span>
                      <span className="font-medium">${userPosition.currentValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">P&L</span>
                      <span
                        className={`font-medium ${userPosition.pnl >= 0 ? 'text-success' : 'text-destructive'}`}
                      >
                        {userPosition.pnl >= 0 ? '+' : ''}
                        {userPosition.pnl.toFixed(2)} USD ({userPosition.pnl >= 0 ? '+' : ''}
                        {userPosition.pnlPercentage.toFixed(2)}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Open Date</span>
                      <span className="font-medium">{userPosition.openDate}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        Increase
                      </Button>
                      <Button variant="destructive" size="sm">
                        Close Position
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center py-2">
                      <p className="text-muted-foreground mb-2">
                        You don't have a position in this Baskt yet.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Get started by opening a long or short position.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <span className="text-success">Long</span>
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <span className="text-destructive">Short</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column - Trading form */}
          <div className="col-span-3">
            <Card>
              <CardContent className="pt-6">
                <BasktTradingForm baskt={baskt} userPosition={userPosition} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <CreateBasktDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </Layout>
  );
}
