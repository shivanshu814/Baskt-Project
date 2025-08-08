'use client';

import { memo } from 'react';
import { EmptyStateContainerProps } from '../../../types/baskt';

export const EmptyStateContainer = memo(
  ({ children, className = '' }: EmptyStateContainerProps) => (
    <div className={`flex flex-col items-center justify-center min-h-[400px] w-full ${className}`}>
      <div className="relative w-full max-w-full mx-auto text-center">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent blur-xl" />
        </div>

        <div className="relative bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 sm:p-12 shadow-2xl w-full">
          {children}
        </div>
      </div>
    </div>
  ),
);

EmptyStateContainer.displayName = 'EmptyStateContainer';
