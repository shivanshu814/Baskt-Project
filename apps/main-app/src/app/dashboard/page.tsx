'use client';

// import { useState, useEffect } from 'react';
import { PortfolioDistribution } from '../../components/dashboard/PortfolioDistribution';
import { BasketAllocationPie } from '../../components/dashboard/TokenAllocationPie';
import PortfolioValueCard from '../../components/dashboard/PortfolioValueCard';
import UsdcCollateralCard from '../../components/dashboard/UsdcCollateralCard';
import PositionsOrdersCard from '../../components/dashboard/PositionsOrdersCard';
import MyBaskts from '../../components/dashboard/UsersBaskts';
import RecentActivity from '../../components/dashboard/RecentActivity';
// import PortfolioValueGraph from '../../components/dashboard/PortfolioValueGraph';
import { useDashboardData } from '../../hooks/dashboard/useDashboardData';

export default function DashboardPage() {
  const {
    portfolioSummary,
    chartData,
    recentActivity,
    openOrders,
    usdcBalance,
    isLoading,
    myBaskts,
  } = useDashboardData();

  const myBasktsData = (myBaskts || [])
    // eslint-disable-next-line
    .filter((b: any): b is NonNullable<typeof b> => b != null)
    // eslint-disable-next-line
    .map((b: any) => ({
      basktId: b.basktId,
      name: b.name ?? '',
      price: b.price ?? 0,
      change24h: b.change24h ?? 0,
      aum: b.aum ?? 0,
    }));

  // const [portfolioValueHistory, setPortfolioValueHistory] = useState(() => {
  //   const now = Date.now();
  //   return Array.from({ length: 10 }, (_, i) => {
  //     const timestamp = now - (9 - i) * 60 * 1000;
  //     return {
  //       date: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  //       value: 1000 + Math.round(Math.sin(i / 2) * 200 + Math.random() * 100),
  //     };
  //   });
  // });

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setPortfolioValueHistory((prev) => {
  //       const now = Date.now();
  //       const newValue = prev[prev.length - 1].value + Math.round((Math.random() - 0.5) * 100);
  //       const next = [
  //         ...prev.slice(1),
  //         {
  //           date: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  //           value: Math.max(0, newValue),
  //         },
  //       ];
  //       return next;
  //     });
  //   }, 10000);
  //   return () => clearInterval(interval);
  // }, []);

  // const startValue = portfolioValueHistory[0]?.value || 0;

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Trading Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your portfolio, track positions, and analyze market performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <PortfolioValueCard portfolioSummary={portfolioSummary} />
        <UsdcCollateralCard
          usdcBalance={usdcBalance}
          totalCollateral={portfolioSummary.totalCollateral}
        />
        <PositionsOrdersCard
          openPositions={portfolioSummary.openPositions}
          openOrders={openOrders.length}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <PortfolioDistribution basktData={chartData.basktDistribution} />
        <BasketAllocationPie data={chartData.tokenAllocation} />
        {/* <PortfolioValueGraph
          portfolioValueHistory={portfolioValueHistory}
          startValue={startValue}
        /> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <MyBaskts myBaskts={myBasktsData} />
        <RecentActivity recentActivity={recentActivity} />
      </div>
    </main>
  );
}
