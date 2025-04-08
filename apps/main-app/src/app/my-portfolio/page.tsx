'use client';

import { Layout } from '../../components/Layout';
import { BasktPositionsTable } from '../../components/baskt/BasktPositionsTable';
import { Button } from '../../components/src/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/src/card';
import { ArrowRightLeft, DollarSign, LineChart, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Baskt, UserBasktPosition } from '../../types/baskt';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { LoadingScreen } from '../../components/LoadingScreen';
interface BasktPosition {
  baskt: Baskt;
  position: UserBasktPosition;
}

interface PortfolioPerformance {
  day: number;
  week: number;
  month: number;
}

export default function MyPortfolio() {
  const { authenticated, ready } = usePrivy();
  const router = useRouter();
  const [basktPositions, setBasktPositions] = useState<BasktPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true); //eslint-disable-line
  const [performance, setPerformance] = useState<PortfolioPerformance>({
    day: 0,
    week: 0,
    month: 0,
  });

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/login');
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        // TODO: Replace with actual API calls
        // const positionsResponse = await fetch('/api/portfolio/positions');
        // const positionsData = await positionsResponse.json();
        // const basktsResponse = await fetch('/api/baskts');
        // const basktsData = await basktsResponse.json();
        // const performanceResponse = await fetch('/api/portfolio/performance');
        // const performanceData = await performanceResponse.json();

        // Map positions to baskts
        // const mappedPositions = positionsData.map((position: UserBasktPosition) => {
        //   const baskt = basktsData.find((b: Baskt) => b.id === position.basktId);
        //   return { baskt, position };
        // });

        // setBasktPositions(mappedPositions);
        // setPerformance(performanceData);
        setBasktPositions([]);
        setPerformance({ day: 0, week: 0, month: 0 });
      } catch (error) {
        console.error('Error fetching portfolio data:', error); //eslint-disable-line
        setBasktPositions([]);
        setPerformance({ day: 0, week: 0, month: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolioData();
  }, []);

  if (!ready || !authenticated) {
    return <LoadingScreen />;
  }

  // Calculate portfolio metrics
  const totalValue = basktPositions.reduce((sum, item) => sum + item.position.currentValue, 0);
  const totalInvested = basktPositions.reduce((sum, item) => sum + item.position.positionSize, 0);
  const totalPnl = basktPositions.reduce((sum, item) => sum + item.position.pnl, 0);
  const pnlPercentage = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const isProfitable = totalPnl >= 0;

  const getPerformanceColor = (value: number) => {
    return value >= 0 ? 'text-success' : 'text-destructive';
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-4">
          <h1 className="text-3xl font-bold tracking-tight">My Portfolio</h1>
          <Link href="/baskts">
            <Button>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Trade Baskts
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-card to-card/90 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Portfolio Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {totalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-sm text-muted-foreground">
                Total investment: ${totalInvested.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/90 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                {isProfitable ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                Profit/Loss
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${isProfitable ? 'text-success' : 'text-destructive'}`}
              >
                {isProfitable ? '+' : ''}$
                {Math.abs(totalPnl).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className={`text-sm ${isProfitable ? 'text-success' : 'text-destructive'}`}>
                {isProfitable ? '+' : ''}
                {pnlPercentage.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-card/90 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <LineChart className="h-4 w-4 text-primary" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-md bg-secondary/30">
                  <p className="text-xs text-muted-foreground">1d</p>
                  <p className={getPerformanceColor(performance.day)}>
                    {performance.day >= 0 ? '+' : ''}
                    {performance.day.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 rounded-md bg-secondary/30">
                  <p className="text-xs text-muted-foreground">7d</p>
                  <p className={getPerformanceColor(performance.week)}>
                    {performance.week >= 0 ? '+' : ''}
                    {performance.week.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 rounded-md bg-secondary/30">
                  <p className="text-xs text-muted-foreground">30d</p>
                  <p className={getPerformanceColor(performance.month)}>
                    {performance.month >= 0 ? '+' : ''}
                    {performance.month.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <BasktPositionsTable positions={basktPositions} />

        {basktPositions.length === 0 && (
          <Card className="text-center p-12">
            <CardContent>
              <h3 className="text-xl font-medium mb-2">You don't have any positions yet</h3>
              <p className="text-muted-foreground mb-6">
                Start trading Baskts to build your portfolio.
              </p>
              <Link href="/baskts">
                <Button>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Trade Baskts
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
