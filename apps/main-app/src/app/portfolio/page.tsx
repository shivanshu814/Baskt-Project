'use client';

import { NumberFormat } from '@baskt/ui';
import { useState } from 'react';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import { PortfolioHeader } from '../../components/portfolio/PortfolioHeader';
import {
  PortfolioTabControls,
  PortfolioTabType,
} from '../../components/portfolio/tabs/PortfolioTabControls';
import { PortfolioTabContent } from '../../components/portfolio/tabs/tab-content/PortfolioTabContent';
import { WalletBreakdown } from '../../components/portfolio/wallet-breakdown/WalletBreakdown';
import { usePortfolioSummary } from '../../hooks/portfolio/use-portfolio-summary';

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<PortfolioTabType>('positions');

  const {
    usdcBalance,
    totalCollateral,
    totalPnL,
    percentagePnL,
    totalPortfolioValue,
    isLoading,
    error,
  } = usePortfolioSummary();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const safeUsdcBalance = error ? 0 : usdcBalance;
  const safeTotalCollateral = error ? 0 : totalCollateral;
  const safeTotalPnL = error ? 0 : totalPnL;
  const safePercentagePnL = error ? 0 : percentagePnL;
  const safeTotalPortfolioValue = error ? 0 : totalPortfolioValue;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-9xl">
        <div className="mb-8">
          <PortfolioHeader />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mb-8">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-gray border-primary/30 border border rounded-lg p-6 hover:shadow-lg">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Total Portfolio Value
              </h3>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                <NumberFormat
                  value={Number(safeTotalPortfolioValue) * 1e6}
                  isPrice={true}
                  showCurrency={true}
                />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm ${
                    safeTotalPnL >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {safeTotalPnL >= 0 ? '+' : ''}${safeTotalPnL.toFixed(2)}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    safePercentagePnL >= 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}
                >
                  {safePercentagePnL >= 0 ? '+' : ''}
                  {safePercentagePnL.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="bg-gray border-primary/30 border border rounded-lg p-6 hover:shadow-lg">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Funds</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">USDC Balance</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    <NumberFormat
                      value={safeUsdcBalance * 1e6}
                      isPrice={true}
                      showCurrency={true}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Total Collateral
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    <NumberFormat
                      value={safeTotalCollateral * 1e6}
                      isPrice={true}
                      showCurrency={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-gray rounded-lg p-6 border border-primary/30">
            <WalletBreakdown />
          </div>
        </div>

        <div className="mb-2">
          <PortfolioTabControls activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="mb-8">
          <PortfolioTabContent activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}
