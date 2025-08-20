'use client';

import { useState } from 'react';
import { WalletBreakdownProps, WalletTabType } from '../../../types/portfolio';
import { WalletTabContent } from '../tabs/tab-content/WalletTabContent';
import { WalletTabControls } from '../tabs/WalletTabControls';

export const WalletBreakdown = ({ basktBreakdown, assetBreakdown }: WalletBreakdownProps) => {
  const [activeTab, setActiveTab] = useState<WalletTabType>('baskts');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Wallet breakdown</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {basktBreakdown && basktBreakdown.length > 0
              ? `Your traded baskts (${basktBreakdown.length})`
              : 'No traded baskts yet'}
          </p>
        </div>

        <WalletTabControls activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <WalletTabContent
        activeTab={activeTab}
        tradedBaskts={basktBreakdown || []}
        tradedAssets={assetBreakdown || []}
      />
    </div>
  );
};
