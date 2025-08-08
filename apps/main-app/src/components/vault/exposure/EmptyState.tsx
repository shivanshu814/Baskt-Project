'use client';
import { BarChart3 } from 'lucide-react';
import React from 'react';

export const EmptyState = React.memo(() => (
  <div className="flex flex-col items-center justify-center py-12 px-6">
    <div className="flex flex-col items-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <BarChart3 className="h-8 w-8 text-primary/60" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">No Exposure Data</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Exposure data will appear here once the vault has active positions and liquidity
          allocations.
        </p>
      </div>
    </div>
  </div>
));

EmptyState.displayName = 'EmptyState';
