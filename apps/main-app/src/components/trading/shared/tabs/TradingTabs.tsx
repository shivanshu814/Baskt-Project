import { Tabs, TabsContent, TabsList, TabsTrigger, useBasktClient } from '@baskt/ui';
import { useState } from 'react';
import { useBasktRebalance } from '../../../../hooks/trade/action/use-baskt-rebalance';
import { useOpenOrders } from '../../../../hooks/trade/action/use-open-orders';
import { useOpenPositions } from '../../../../hooks/trade/action/use-open-positions';
import { useOrderHistory } from '../../../../hooks/trade/action/use-order-history';
import { useModalState } from '../../../../hooks/trade/modals/use-modal-state';
import { OrderDetails } from '../../../../types/baskt/trading/components/tabs';
import { TradingTabsProps } from '../../../../types/baskt/trading/orders';
import { CompositionTab } from './CompositionTab';
import { InfoTab } from './InfoTab';
import { MetricsTab } from './MetricsTab';
import { OpenOrdersTab } from './OpenOrdersTab';
import { OrdersHistoryTab } from './OrdersHistoryTab';
import { PositionsTab } from './PositionsTab';
import { RebalanceTab } from './RebalanceTab';

export function TradingTabs({ baskt }: TradingTabsProps) {
  const [activeTab, setActiveTab] = useState('composition');
  const [mobileTab] = useState<'markets' | 'trade'>('markets');
  const { client: basktClient } = useBasktClient();
  const userAddress = basktClient?.wallet?.address?.toString();
  const modalState = useModalState();

  const { positions = [] } = useOpenPositions(baskt?.basktId, userAddress);
  // TODO: Shivanshu this can be done in one fetch. 
  const { orders = [], processedOrders = [] } = useOpenOrders(baskt?.basktId, userAddress, baskt);
  const { orders: orderHistory = [] } = useOrderHistory(baskt?.basktId, userAddress);
  const { isRebalancing, rebalanceBaskt } = useBasktRebalance();

  const handleRebalance = () => {
    if (baskt) {
      rebalanceBaskt(baskt);
    }
  };

  const onAddCollateral = (position: any) => {
    modalState.openAddCollateralModal(position);
  };

  const onClosePosition = (position: any) => {
    modalState.openClosePositionModal(position);
  };

  const onCancelOrder = (order: OrderDetails) => {
    modalState.openCancelOrderModal(order);
  };

  return (
    <div className="border border-border bg-zinc-900/80 mt-1 mb-1 rounded-sm flex-1 overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        <TabsList className="w-full flex-shrink-0 overflow-x-auto">
          {mobileTab === 'markets' && (
            <>
              <TabsTrigger value="composition" className="flex-1 min-w-0 sm:hidden">
                <span>Comp</span>
              </TabsTrigger>
              <TabsTrigger value="positions" className="flex-1 min-w-0 sm:hidden">
                <span>Pos</span>
              </TabsTrigger>
              <TabsTrigger value="open-orders" className="flex-1 min-w-0 sm:hidden">
                <span>Orders</span>
              </TabsTrigger>
              <TabsTrigger value="orders-history" className="flex-1 min-w-0 sm:hidden">
                <span>His</span>
              </TabsTrigger>
              <TabsTrigger value="info" className="flex-1 min-w-0 sm:hidden">
                <span>Inf</span>
              </TabsTrigger>
              <TabsTrigger value="rebalance" className="flex-1 min-w-0 sm:hidden">
                <span>Rebal</span>
              </TabsTrigger>
              <TabsTrigger value="metrics" className="ml-4 flex-1 min-w-0 sm:hidden">
                <span>Met</span>
              </TabsTrigger>
            </>
          )}

          <TabsTrigger value="composition" className="flex-1 min-w-0 hidden sm:block">
            <span>Composition ({baskt?.assets?.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex-1 min-w-0 hidden sm:block">
            <span>Positions ({positions.length})</span>
          </TabsTrigger>
          <TabsTrigger value="open-orders" className="flex-1 min-w-0 hidden sm:block">
            <span>Open Orders ({orders.length})</span>
          </TabsTrigger>
          <TabsTrigger value="orders-history" className="flex-1 min-w-0 hidden sm:block">
            <span>Order History</span>
          </TabsTrigger>
          <TabsTrigger value="info" className="flex-1 min-w-0 hidden sm:block">
            <span>Info</span>
          </TabsTrigger>
          <TabsTrigger value="rebalance" className="flex-1 min-w-0 hidden sm:block">
            <span>Rebalance</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex-1 min-w-0 hidden sm:block">
            <span>Metrics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="composition" className="-mt-2 flex-1 overflow-hidden px-1 p-2">
          <CompositionTab baskt={baskt} />
        </TabsContent>

        <TabsContent value="positions" className="flex-1 overflow-y-auto p-4">
          <PositionsTab
            baskt={baskt}
            positions={positions}
            onAddCollateral={onAddCollateral}
            onClosePosition={onClosePosition}
          />
        </TabsContent>

        <TabsContent value="open-orders" className="flex-1 overflow-y-auto p-4">
          <OpenOrdersTab baskt={baskt} orders={processedOrders} onCancelOrder={onCancelOrder} />
        </TabsContent>

        <TabsContent value="orders-history" className="flex-1 overflow-y-auto p-4">
          <OrdersHistoryTab baskt={baskt} orders={orderHistory} />
        </TabsContent>

        <TabsContent value="info" className="flex-1 overflow-y-auto p-4">
          <InfoTab baskt={baskt} />
        </TabsContent>

        <TabsContent value="rebalance" className="flex-1 overflow-y-auto p-4">
          <RebalanceTab
            baskt={baskt}
            userAddress={userAddress}
            isRebalancing={isRebalancing}
            onRebalance={handleRebalance}
          />
        </TabsContent>

        <TabsContent value="metrics" className="flex-1 overflow-y-auto p-4">
          <MetricsTab baskt={baskt} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
