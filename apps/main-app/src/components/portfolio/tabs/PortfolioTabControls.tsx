'use client';

import { Button } from '@baskt/ui';
import { BarChart3, Briefcase, Clock, History } from 'lucide-react';

export type PortfolioTabType = 'positions' | 'baskts' | 'open-orders' | 'order-history';

export interface PortfolioTabControlsProps {
  activeTab: PortfolioTabType;
  onTabChange: (tab: PortfolioTabType) => void;
}

export const PortfolioTabControls = ({ activeTab, onTabChange }: PortfolioTabControlsProps) => {
  return (
    <div className="inline-flex items-center gap-1 mb-1 sm:mb-1 border border-border rounded-lg p-1 bg-background">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onTabChange('positions')}
        className={`flex items-center gap-2 hover:text-primary transition-all duration-200 hover:bg-primary/5 rounded-md px-3 py-2 ${
          activeTab === 'positions' ? 'text-primary bg-primary/5' : 'text-muted-foreground'
        }`}
      >
        <BarChart3 className="h-4 w-4" />
        Positions
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onTabChange('baskts')}
        className={`flex items-center gap-2 hover:text-primary transition-all duration-200 hover:bg-primary/5 rounded-md px-3 py-2 ${
          activeTab === 'baskts' ? 'text-primary bg-primary/5' : 'text-muted-foreground'
        }`}
      >
        <Briefcase className="h-4 w-4" />
        Baskts
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onTabChange('open-orders')}
        className={`flex items-center gap-2 hover:text-primary transition-all duration-200 hover:bg-primary/5 rounded-md px-3 py-2 ${
          activeTab === 'open-orders' ? 'text-primary bg-primary/5' : 'text-muted-foreground'
        }`}
      >
        <Clock className="h-4 w-4" />
        Open Orders
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onTabChange('order-history')}
        className={`flex items-center gap-2 hover:text-primary transition-all duration-200 hover:bg-primary/5 rounded-md px-3 py-2 ${
          activeTab === 'order-history' ? 'text-primary bg-primary/5' : 'text-muted-foreground'
        }`}
      >
        <History className="h-4 w-4" />
        Order History
      </Button>
    </div>
  );
};
