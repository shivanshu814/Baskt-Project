'use client';

import { PortfolioTabContentProps } from '../../../../types/portfolio';
import { PositionsTable } from '../../PositionsTable';
import { OpenOrdersTable } from '../OpenOrdersTable';
import { OrderHistoryTable } from '../OrderHistoryTable';
import { UserBaskts } from '../UserBaskts';

export const PortfolioTabContent = ({
  activeTab,
  positions,
  openOrders,
  userBaskts,
}: PortfolioTabContentProps) => {
  switch (activeTab) {
    case 'positions':
      return <PositionsTable positions={positions} />;
    case 'baskts':
      return <UserBaskts userBaskts={userBaskts} />;
    case 'open-orders':
      return <OpenOrdersTable openOrders={openOrders} />;
    case 'order-history':
      return <OrderHistoryTable />;
    default:
      return <PositionsTable positions={positions} />;
  }
};
