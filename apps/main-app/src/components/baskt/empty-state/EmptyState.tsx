'use client';

import { memo } from 'react';
import { useEmptyState } from '../../../hooks/baskt/empty/empty-state';
import { EmptyStateProps } from '../../../types/baskt';
import { EmptyStateContainer } from './EmptyStateContainer';
import { EmptyStateContent } from './EmptyStateContent';

export const EmptyState = memo(({ onCreateClick }: EmptyStateProps) => {
  const { config, icon } = useEmptyState('noBasktsFound', onCreateClick);

  return (
    <EmptyStateContainer>
      <EmptyStateContent
        title={config.title}
        description={config.description}
        buttonText={config.buttonText}
        icon={icon}
        onButtonClick={config.onButtonClick}
      />
    </EmptyStateContainer>
  );
});

export const WalletEmptyState = memo(({ onConnectClick }: { onConnectClick: () => void }) => {
  const { config, icon } = useEmptyState('walletConnect', onConnectClick);

  return (
    <EmptyStateContainer>
      <EmptyStateContent
        title={config.title}
        description={config.description}
        buttonText={config.buttonText}
        icon={icon}
        onButtonClick={config.onButtonClick}
      />
    </EmptyStateContainer>
  );
});

export const NoBasktsCreatedState = memo(({ onCreateClick }: { onCreateClick: () => void }) => {
  const { config, icon } = useEmptyState('noBasktsCreated', onCreateClick);

  return (
    <EmptyStateContainer>
      <EmptyStateContent
        title={config.title}
        description={config.description}
        buttonText={config.buttonText}
        icon={icon}
        onButtonClick={config.onButtonClick}
      />
    </EmptyStateContainer>
  );
});
