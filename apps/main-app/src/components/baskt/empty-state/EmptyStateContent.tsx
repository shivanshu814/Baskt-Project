'use client';

import { memo } from 'react';
import { EmptyStateContentProps } from '../../../types/baskt';
import { EmptyStateButton } from './EmptyStateButton';
import { EmptyStateIcon } from './EmptyStateIcon';

export const EmptyStateContent = memo(
  ({ title, description, buttonText, icon, onButtonClick }: EmptyStateContentProps) => (
    <>
      <EmptyStateIcon icon={icon} />

      <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
        {title}
      </h3>

      <p className="text-sm sm:text-base text-muted-foreground/90 mb-8 sm:mb-10 max-w-md mx-auto leading-relaxed">
        {description}
      </p>

      <EmptyStateButton onClick={onButtonClick} text={buttonText} icon={icon} />
    </>
  ),
);

EmptyStateContent.displayName = 'EmptyStateContent';
