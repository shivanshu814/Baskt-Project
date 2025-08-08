'use client';

import { memo } from 'react';
import { EmptyStateIconProps } from '../../../types/baskt';

export const EmptyStateIcon = memo(({ icon: Icon, className = '' }: EmptyStateIconProps) => (
  <div className="mb-6 sm:mb-8 flex justify-center">
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full blur-md" />
      <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 rounded-full p-4 sm:p-5 border border-primary/20">
        <Icon className={`w-8 h-8 sm:w-10 sm:h-10 text-primary ${className}`} />
      </div>
    </div>
  </div>
));

EmptyStateIcon.displayName = 'EmptyStateIcon';
