import React, { useState } from 'react';
import { BasktPosition } from './position/BasktPosition';
import { BasktOpenOrders } from './orders/BasktOpenOrders';
import { BasktOrderHistory } from './history/BasktOrderHistory';
import { IndexComposition } from './composition/IndexComposition';
import { BasktTabsProps } from '../../../../types/baskt';
import { MetricsGrid } from './metrics/MetricsGrid';
import BN from 'bn.js';
import { useOpenPositions } from '../../../../hooks/baskt/trade/useOpenPositions';
import { useOpenOrders } from '../../../../hooks/baskt/trade/useOpenOrders';
import { useBasktClient } from '@baskt/ui';

type TabType = 'composition' | 'position' | 'openOrders' | 'orderHistory' | 'metrics';

export const BasktTabs = ({ baskt }: BasktTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('composition');

  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();
  const { positions = [] } = useOpenPositions(baskt.basktId, userAddress);
  const { orders = [] } = useOpenOrders(baskt.basktId, userAddress);

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
    { id: 'position', label: `Positions (${positions.length})` },
    { id: 'openOrders', label: `Open Orders (${orders.length})` },
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
