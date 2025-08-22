'use client';

import { NumberFormat } from '@baskt/ui';
import { useState } from 'react';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import { PortfolioHeader } from '../../components/portfolio/PortfolioHeader';
import { PortfolioTabControls } from '../../components/portfolio/tabs/PortfolioTabControls';
import { PortfolioTabContent } from '../../components/portfolio/tabs/tab-content/PortfolioTabContent';
import { WalletBreakdown } from '../../components/portfolio/wallet-breakdown/WalletBreakdown';
import { useYourBaskts } from '../../hooks/baskt/use-explore-data';
import { useUSDCBalance } from '../../hooks/pool/use-usdc-balance';
import { usePortfolioData } from '../../hooks/portfolio/use-portfolio-data';
import { PortfolioTabType } from '../../types/portfolio';

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<PortfolioTabType>('positions');

  const { balance: usdcBalance } = useUSDCBalance();
  const { baskts: {
    yourBaskts
  } } = useYourBaskts(activeTab === 'baskts');
  const { data: portfolioData, isLoading } = usePortfolioData();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-9xl">
        <div className="mb-2 -mt-8">
          <PortfolioHeader />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mb-8">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-gray border-muted border border rounded-lg p-6 hover:shadow-lg">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Total Portfolio Value
              </h3>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                <NumberFormat
                  value={Number(portfolioData?.metrics?.totalPortfolioValue)}
                  isPrice={true}
                  showCurrency={true}
                />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm ${
                    Number(portfolioData?.metrics?.totalPnl) >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {Number(portfolioData?.metrics?.totalPnl) >= 0 ? '+' : ''}$
                  {Number(portfolioData?.metrics?.totalPnl).toFixed(2)}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    Number(portfolioData?.metrics?.totalPnlPercentage) >= 0
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {Number(portfolioData?.metrics?.totalPnlPercentage) >= 0 ? '+' : ''}
                  {Number(portfolioData?.metrics?.totalPnlPercentage).toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="bg-gray border-muted border border rounded-lg p-6 hover:shadow-lg">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Funds</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">USDC Balance</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    <NumberFormat
                      value={Number(usdcBalance) * 1e6}
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
                      value={Number(portfolioData?.metrics?.totalCollateral)}
                      isPrice={true}
                      showCurrency={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-gray rounded-lg p-6 border border-muted">
            <WalletBreakdown
              basktBreakdown={portfolioData?.basktBreakdown}
              assetBreakdown={portfolioData?.assetBreakdown}
            />
          </div>
        </div>

        <div className="mb-2">
          <PortfolioTabControls activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="mb-8">
          <PortfolioTabContent
            activeTab={activeTab}
            positions={portfolioData?.positions}
            openOrders={portfolioData?.openOrders}
            orderHistory={portfolioData?.orderHistory}
            userBaskts={yourBaskts}
          />
        </div>
      </div>
    </div>
  );
}
