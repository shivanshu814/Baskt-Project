import React, { useState } from 'react';
import { Card, CardContent } from '../../ui/card';
import { BasktPosition } from './BasktPosition';
import { BasktOpenOrders } from './BasktOpenOrders';
import { BasktOrderHistory } from './BasktOrderHistory';
import { IndexComposition } from './IndexComposition';
import { BasktTabsProps } from '../../../types/baskt';

type TabType = 'composition' | 'position' | 'openOrders' | 'orderHistory';

export const BasktTabs = ({ baskt, userPosition }: BasktTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('composition');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'composition':
        return <IndexComposition assets={baskt?.assets || []} />;
      case 'position':
        return <BasktPosition userPosition={userPosition} />;
      case 'openOrders':
        return <BasktOpenOrders />;
      case 'orderHistory':
        return <BasktOrderHistory />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center border-b">
          <div className="flex items-center space-x-8 mx-4">
            <button
              className={`px-1 py-2 text-[14px] ${
                activeTab === 'composition'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
              onClick={() => setActiveTab('composition')}
            >
              Composition
            </button>
            <button
              className={`px-1 py-2 text-[14px] ${
                activeTab === 'position'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
              onClick={() => setActiveTab('position')}
            >
              Position
            </button>
            <button
              className={`px-1 py-2 text-[14px] ${
                activeTab === 'openOrders'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
              onClick={() => setActiveTab('openOrders')}
            >
              Open Orders
            </button>
            <button
              className={`px-1 py-2 text-[14px] ${
                activeTab === 'orderHistory'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
              onClick={() => setActiveTab('orderHistory')}
            >
              Order History
            </button>
          </div>
        </div>
        {renderTabContent()}
      </CardContent>
    </Card>
  );
};
