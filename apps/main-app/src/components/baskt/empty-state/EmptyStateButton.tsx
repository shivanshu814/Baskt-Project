'use client';

import { Button } from '@baskt/ui';
import { memo } from 'react';
import { EmptyStateButtonProps } from '../../../types/baskt';

export const EmptyStateButton = memo(
  ({ onClick, text, icon: Icon, className = '' }: EmptyStateButtonProps) => (
    <Button
      onClick={onClick}
      size="lg"
      className={`relative overflow-hidden bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <Icon className="mr-2 h-5 w-5 relative z-10" />
      <span className="relative z-10">{text}</span>
    </Button>
  ),
);

EmptyStateButton.displayName = 'EmptyStateButton';
