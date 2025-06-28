import React, { useState } from 'react';
import { BasktPosition } from './BasktPosition';
import { BasktOpenOrders } from './BasktOpenOrders';
import { BasktOrderHistory } from './BasktOrderHistory';
import { IndexComposition } from './IndexComposition';
import { BasktTabsProps } from '../../../types/baskt';
import BN from 'bn.js';
import { MetricsGrid } from './MetricsGrid';

type TabType = 'composition' | 'position' | 'openOrders' | 'orderHistory' | 'metrics';

export const BasktTabs = ({ baskt }: BasktTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('composition');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'composition':
        return <IndexComposition assets={baskt?.assets || []} />;
      case 'position':
        return <BasktPosition basktId={baskt.basktId} navPrice={new BN(baskt.price)} />;
      case 'openOrders':
        return <BasktOpenOrders basktId={baskt.basktId} />;
      case 'orderHistory':
        return <BasktOrderHistory basktId={baskt.basktId} />;
      case 'metrics':
        return <MetricsGrid baskt={baskt} />;
      default:
        return null;
    }
  };

  const tabs: { id: TabType | 'metrics'; label: string }[] = [
    { id: 'composition', label: 'Composition' },
    { id: 'position', label: 'Position' },
    { id: 'openOrders', label: 'Open Orders' },
    { id: 'orderHistory', label: 'Order History' },
    { id: 'metrics', label: 'Metrics' },
  ];

  return (
    <div className="border-b border-muted-foreground/20">
      <div className="border-b border-muted-foreground/20">
        <div className="flex items-center space-x-4 sm:space-x-6 px-4 overflow-x-auto whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
              onClick={() => setActiveTab(tab.id as TabType | 'metrics')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-2 sm:p-4 border-b border-muted-foreground/20">{renderTabContent()}</div>
    </div>
  );
};
