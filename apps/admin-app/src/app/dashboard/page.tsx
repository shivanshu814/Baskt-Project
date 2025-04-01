'use client';

import { Layout } from '../../components/Layout';
import { CryptoCard } from '../../components/market/CryptoCard';
import { MarketOverview } from '../../components/market/MarketOverview';
import { MarketTrend } from '../../components/market/MarketTrend';
import { PortfolioSummary } from '../../components/market/PortfolioSummary';
import { TradingViewChart } from '../../components/market/TradingViewChart';
import { marketTrends, popularCryptos } from '../../data/market-data';

export default function Dashboard() {
  // Take only first 4 cryptocurrencies for the cards display
  const topCryptos = popularCryptos.slice(0, 4);

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
            <TradingViewChart />
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
