'use client';

import { PositionsTable } from '../../PositionsTable';
import { OpenOrdersTable } from '../OpenOrdersTable';
import { OrderHistoryTable } from '../OrderHistoryTable';
import { PortfolioTabType } from '../PortfolioTabControls';
import { UserBaskts } from '../UserBaskts';

export interface PortfolioTabContentProps {
  activeTab: PortfolioTabType;
}

export const PortfolioTabContent = ({ activeTab }: PortfolioTabContentProps) => {
  switch (activeTab) {
    case 'positions':
      return <PositionsTable />;
    case 'baskts':
      return <UserBaskts />;
    case 'open-orders':
      return <OpenOrdersTable />;
    case 'order-history':
      return <OrderHistoryTable />;
    default:
      return <PositionsTable />;
  }
};
