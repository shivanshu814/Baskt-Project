'use client';

import { Button } from '@baskt/ui';
import { TrendingUp, User } from 'lucide-react';
import { TabControlsProps } from '../../../types/baskt';

export const TabControls = ({ activeTab, onTabChange }: TabControlsProps) => {
  return (
    <div className="inline-flex items-center gap-1 mb-1 sm:mb-1 border border-border rounded-lg p-1 bg-background">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onTabChange('all')}
        className={`flex items-center gap-2 hover:text-primary transition-all duration-200 hover:bg-primary/5 rounded-md px-3 py-2 ${
          activeTab === 'all' ? 'text-primary bg-primary/5' : 'text-muted-foreground'
        }`}
      >
        All Baskts
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onTabChange('trending')}
        className={`flex items-center gap-2 hover:text-primary transition-all duration-200 hover:bg-primary/5 rounded-md px-3 py-2 ${
          activeTab === 'trending' ? 'text-primary bg-primary/5' : 'text-muted-foreground'
        }`}
      >
        <TrendingUp className="h-4 w-4" />
        Trending
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onTabChange('your')}
        className={`flex items-center gap-2 hover:text-primary transition-all duration-200 hover:bg-primary/5 rounded-md px-3 py-2 ${
          activeTab === 'your' ? 'text-primary bg-primary/5' : 'text-muted-foreground'
        }`}
      >
        <User className="h-4 w-4" />
        Your Baskts
      </Button>
    </div>
  );
};
