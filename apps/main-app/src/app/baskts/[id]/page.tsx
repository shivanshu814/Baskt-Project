'use client';

import { PublicKeyText } from '../../../components/PublicKeyText';
import { BasktTradingForm } from '../../../components/baskt/BasktTradingForm';
import { TradingViewChart } from '../../../components/market/TradingViewChart';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { ArrowUp, ArrowDown, Share2, LineChart, CandlestickChart } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { IndexComposition } from '../../../components/baskt/IndexComposition';
import { useState, useEffect } from 'react';
import { BasktInfo, UserBasktPositionInfo } from '@baskt/types';
import { SuggestedBaskts } from '../../../components/baskt/SuggestedBaskts';
import { ShareBasktModal } from '../../../components/baskt/ShareBasktModal';
import { CryptoNews } from '../../../components/baskt/CryptoNews';
import { trpc } from '../../../utils/trpc';

export default function BasktDetailPage() {
  const router = useRouter();
  const params = useParams();
  const basktId = params.id as string;
  const [baskt, setBaskt] = useState<BasktInfo | null>(null);
  const [userPosition, setUserPosition] = useState<UserBasktPositionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('1D');
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');

  const { data: cryptoNews = [] } = trpc.crypto.getCryptoNews.useQuery(undefined, {
    staleTime: 120 * 60 * 1000, // 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: basktInfo, isSuccess: isBasktDataLoaded } =
    trpc.baskt.getBasktMetadataById.useQuery({ basktId });

  const suggestedBaskts = [
    {
      id: '1',
      name: 'DeFi Blue Chips',
      price: 125.5,
      change24h: 3.2,
    },
    {
      id: '2',
      name: 'AI & Big Data',
      price: 98.75,
      change24h: -1.5,
    },
    {
      id: '3',
      name: 'Gaming & Metaverse',
      price: 87.25,
      change24h: 5.8,
    },
    {
      id: '4',
      name: 'Layer 1 Tokens',
      price: 156.8,
      change24h: 2.1,
    },
    {
      id: '5',
      name: 'NFT & Digital Art',
      price: 75.3,
      change24h: -2.3,
    },
  ];

  useEffect(() => {
    const fetchBasktData = async () => {
      if (!isBasktDataLoaded) return;
      try {
        if (!basktInfo) {
          throw new Error('Baskt not found');
        }

        const tempPosition: UserBasktPositionInfo = {
          basktId: basktId,
          type: 'long',
          positionSize: 1000,
          entryPrice: 145.5,
          currentValue: 1502.5,
          pnl: 52.5,
          pnlPercentage: 3.61,
          openDate: '2024-03-20',
          collateral: 1500,
          userBalance: 5000,
        };

        setUserPosition(tempPosition);
        setBaskt((basktInfo as any).data as BasktInfo);
      } catch (error) {
        console.error('Error fetching baskt data:', error);
        setBaskt(null);
        setUserPosition(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBasktData();
  }, [basktId, isBasktDataLoaded]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!baskt) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-2xl font-bold mb-2">Baskt not found</h2>
          <p className="text-muted-foreground mb-4">
            The baskt you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push('/baskts')}>Back to Baskts</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6 animate-fade-in p-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                      {basktInfo ? (
                        <img
                          src={baskt.image}
                          alt={baskt.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="font-semibold text-primary text-sm">
                          {baskt.name.substring(0, 2)}
                        </div>
                      )}
                    </div>

                    <h1 className="text-[18px] font-bold">{baskt.name}</h1>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setIsShareModalOpen(true)}
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="sr-only">Share</span>
                  </Button>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <div className="text-[32px] font-bold">${baskt.price.toLocaleString()}</div>
                    <div
                      className={`flex items-center gap-1 ${baskt.change24h >= 0 ? 'text-[#16c784]' : 'text-[#ea3943]'}`}
                    >
                      {baskt.change24h >= 0 ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      <span className="text-[12px]">
                        {Math.abs(baskt.change24h).toFixed(2)}% (24h)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h3 className="text-[11px] text-muted-foreground">Creator</h3>
                    <PublicKeyText publicKey={baskt.creator} className="font-bold text-[14px]" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[11px] text-muted-foreground">Risk Level</h3>
                    <p className="font-bold text-[14px] capitalize">{baskt.risk}</p>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[11px] text-muted-foreground">Category</h3>
                    <p className="font-bold text-[14px]">{baskt.category}</p>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[11px] text-muted-foreground">Total Assets</h3>
                    <p className="font-bold text-[14px]">{baskt.assets.length}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-sm text-muted-foreground mb-2">Description</h3>
                  <p className="text-sm">{baskt.description}</p>
                </div>
              </CardContent>
            </Card>
            <SuggestedBaskts suggestedBaskts={suggestedBaskts} />
          </div>

          <div className="col-span-6 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between border-b">
                  <div className="flex items-center space-x-8">
                    <button className="px-1 py-2 text-[14px] text-primary border-b-2 border-primary">
                      Chart
                    </button>
                    <button
                      className="px-1 py-2 text-[14px] text-muted-foreground hover:text-primary"
                      onClick={() => {
                        document
                          .getElementById('composition-section')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Composition
                    </button>
                    <button
                      className="px-1 py-2 text-[14px] text-muted-foreground hover:text-primary"
                      onClick={() => {
                        document
                          .getElementById('position-section')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Position
                    </button>
                    <button className="px-1 py-2 text-[14px] text-muted-foreground hover:text-primary">
                      About
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-md px-3 py-1 text-xs ${chartType === 'line' ? 'bg-background text-primary' : 'text-muted-foreground hover:text-primary'}`}
                      onClick={() => setChartType('line')}
                    >
                      <LineChart className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-md px-3 py-1 text-xs ${chartType === 'candle' ? 'bg-background text-primary' : 'text-muted-foreground hover:text-primary'}`}
                      onClick={() => setChartType('candle')}
                    >
                      <CandlestickChart className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
                    {['1D', '1W', '1M', '1Y', 'All'].map((period) => (
                      <Button
                        key={period}
                        variant="ghost"
                        size="sm"
                        className={`rounded-md px-3 py-1 text-xs ${chartPeriod === period ? 'bg-background text-primary' : 'text-muted-foreground hover:text-primary'}`}
                        onClick={() => setChartPeriod(period)}
                      >
                        {period}
                      </Button>
                    ))}
                  </div>
                </div>

                <TradingViewChart
                  className="h-[500px]"
                  dailyData={baskt.priceHistory?.daily || []}
                  weeklyData={baskt.priceHistory?.weekly || []}
                  monthlyData={baskt.priceHistory?.monthly || []}
                  yearlyData={baskt.priceHistory?.yearly || []}
                  chartType={chartType}
                  period={chartPeriod}
                />
              </CardContent>
            </Card>

            <div id="composition-section">
              <IndexComposition assets={baskt.assets} />
            </div>

            <Card id="position-section">
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
                        className={`font-medium ${(userPosition.type || 'long') === 'long' ? 'text-[#16c784]' : 'text-[#ea3943]'}`}
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
                        className={`font-medium ${userPosition.pnl >= 0 ? 'text-[#16c784]' : 'text-[#ea3943]'}`}
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
                        <span className="text-[#16c784]">Long</span>
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <span className="text-[#ea3943]">Short</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="col-span-3 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <BasktTradingForm baskt={baskt} userPosition={userPosition} />
              </CardContent>
            </Card>
            <CryptoNews news={cryptoNews} />
          </div>
        </div>
      </div>

      <ShareBasktModal
        isOpen={isShareModalOpen}
        onOpenChange={setIsShareModalOpen}
        basktName={baskt.name}
        basktPrice={baskt.price}
      />
    </div>
  );
}
