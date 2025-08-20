'use client';

import { Button } from '@baskt/ui';
import { Briefcase, Coins } from 'lucide-react';
import { WalletTabControlsProps } from '../../../types/portfolio';

export const WalletTabControls = ({ activeTab, onTabChange }: WalletTabControlsProps) => {
  return (
    <div className="inline-flex items-center gap-1 border border-border rounded-lg p-1 bg-background">
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
        onClick={() => onTabChange('assets')}
        className={`flex items-center gap-2 hover:text-primary transition-all duration-200 hover:bg-primary/5 rounded-md px-3 py-2 ${
          activeTab === 'assets' ? 'text-primary bg-primary/5' : 'text-muted-foreground'
        }`}
      >
        <Coins className="h-4 w-4" />
        Assets
      </Button>
    </div>
  );
};
