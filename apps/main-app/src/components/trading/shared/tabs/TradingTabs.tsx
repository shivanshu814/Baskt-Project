import { Tabs, TabsContent, TabsList, TabsTrigger, useBasktClient } from '@baskt/ui';
import { useState } from 'react';
import { useOpenOrders } from '../../../../hooks/baskt/trade/use-open-orders';
import { useOpenPositions } from '../../../../hooks/baskt/trade/use-open-positions';
import { useOrderHistory } from '../../../../hooks/baskt/trade/use-order-history';
import { useBasktRebalance } from '../../../../hooks/baskt/use-baskt-rebalance';
import { useUSDCBalance } from '../../../../hooks/pool/use-usdc-balance';
import { useLiquidationPrice } from '../../../../hooks/trading/actions/use-liquidation-price';
import { useModalState } from '../../../../hooks/trading/modals/use-modal-state';
import { TradingTabsProps } from '../../../../types/trading/orders';
import { CompositionTab } from './CompositionTab';
import { InfoTab } from './InfoTab';
import { MetricsTab } from './MetricsTab';
import { OpenOrdersTab } from './OpenOrdersTab';
import { OrdersHistoryTab } from './OrdersHistoryTab';
import { PositionsTab } from './PositionsTab';
import { RebalanceTab } from './RebalanceTab';
import { TradeOrdersTab } from './TradeOrdersTab';

export function TradingTabs({ baskt }: TradingTabsProps) {
  const [activeTab, setActiveTab] = useState('composition');
  const [mobileTab] = useState<'markets' | 'trade'>('markets');
  const [priceColor] = useState('text-foreground');
  const { client: basktClient } = useBasktClient();
  const userAddress = basktClient?.wallet?.address?.toString();
  const { balance: usdcBalance } = useUSDCBalance(userAddress);
  const modalState = useModalState();

  const { getLiquidationPriceFromBaskt } = useLiquidationPrice();
  const getLiquidationPrice = (collateral: number, position: 'long' | 'short') => {
    return getLiquidationPriceFromBaskt(collateral, position, baskt);
  };

  const { positions = [] } = useOpenPositions(baskt?.basktId, userAddress);
  const { orders = [] } = useOpenOrders(baskt?.basktId, userAddress);
  const { orders: orderHistory = [] } = useOrderHistory(baskt?.basktId, userAddress);
  const { isRebalancing, rebalanceBaskt } = useBasktRebalance();

  const handleRebalance = () => {
    if (baskt) {
      rebalanceBaskt(baskt);
    }
  };

  const calculateTotalPositions = (positions: any[]) => {
    const total = positions.reduce((total, pos) => total + (pos.value || 0), 0);
    return { long: total, short: total };
  };

  const onAddCollateral = (position: any) => {
    modalState.openAddCollateralModal(position);
  };

  const onClosePosition = (position: any) => {
    modalState.openClosePositionModal(position);
  };

  const onCancelOrder = (order: any) => {
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
          <OpenOrdersTab baskt={baskt} orders={orders} onCancelOrder={onCancelOrder} />
        </TabsContent>

        <TabsContent value="orders-history" className="flex-1 overflow-y-auto p-4">
          <OrdersHistoryTab baskt={baskt} orders={orderHistory} />
        </TabsContent>

        <TabsContent value="info" className="flex-1 overflow-y-auto p-4">
          <InfoTab baskt={baskt} />
        </TabsContent>

        <TabsContent value="rebalance" className="flex-1 overflow-y-auto p-4">
          <RebalanceTab baskt={baskt} isRebalancing={isRebalancing} onRebalance={handleRebalance} />
        </TabsContent>

        <TabsContent value="metrics" className="flex-1 overflow-y-auto p-4">
          <MetricsTab baskt={baskt} />
        </TabsContent>

        <TabsContent value="trade-orders" className="flex-1 p-4">
          <TradeOrdersTab
            baskt={baskt}
            usdcBalance={usdcBalance}
            positions={positions}
            priceColor={priceColor}
            getLiquidationPrice={getLiquidationPrice}
            calculateTotalPositions={calculateTotalPositions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
