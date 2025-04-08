'use client';

import { Layout } from '../../components/Layout';
import { CryptoCard } from '../../components/market/CryptoCard';
import { MarketOverview } from '../../components/market/MarketOverview';
import { MarketTrend } from '../../components/market/MarketTrend';
import { PortfolioSummary } from '../../components/market/PortfolioSummary';
import { TradingViewChart } from '../../components/market/TradingViewChart';
import { useState, useEffect } from 'react';
import { MarketTrend as MarketTrendType, CryptoAsset, ChartData } from '../../types/baskt';
import { toast } from '../../hooks/use-toast';

export default function Dashboard() {
  const [topCryptos, setTopCryptos] = useState<CryptoAsset[]>([]);
  const [marketTrends, setMarketTrends] = useState<MarketTrendType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<{
    dailyData: ChartData[];
    weeklyData: ChartData[];
    monthlyData: ChartData[];
    yearlyData: ChartData[];
  }>({
    dailyData: [],
    weeklyData: [],
    monthlyData: [],
    yearlyData: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API calls
        // const cryptosResponse = await fetch('/api/market/top-cryptos');
        // const trendsResponse = await fetch('/api/market/trends');
        // const chartResponse = await fetch('/api/market/chart-data');
        // const cryptosData = await cryptosResponse.json();
        // const trendsData = await trendsResponse.json();
        // const chartData = await chartResponse.json();

        // setTopCryptos(cryptosData.slice(0, 4));
        // setMarketTrends(trendsData);
        // setChartData(chartData);
        setTopCryptos([]);
        setMarketTrends([]);
        setChartData({
          dailyData: [],
          weeklyData: [],
          monthlyData: [],
          yearlyData: [],
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error); //eslint-disable-line
        toast({
          title: 'Error',
          description: 'Failed to fetch dashboard data. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <Layout>Loading...</Layout>;
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {marketTrends.map((trend) => (
            <MarketTrend
              key={trend.id}
              id={trend.id}
              title={trend.title}
              asset={trend.asset}
              change={trend.change}
              volume={trend.volume}
              searches={trend.searches}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TradingViewChart
              dailyData={chartData.dailyData}
              weeklyData={chartData.weeklyData}
              monthlyData={chartData.monthlyData}
              yearlyData={chartData.yearlyData}
            />
          </div>
          <div>
            <PortfolioSummary />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {topCryptos.map((crypto) => (
            <CryptoCard key={crypto.id} crypto={crypto} />
          ))}
        </div>

        <MarketOverview />
      </div>
    </Layout>
  );
}
