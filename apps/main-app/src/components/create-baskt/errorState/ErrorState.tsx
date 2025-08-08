'use client';

import { Button } from '@baskt/ui';
import { ErrorStateProps } from '../../../types/asset';

export const ErrorState = ({ error, onRetry }: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center h-64 text-center">
    <div className="text-lg font-semibold text-muted-foreground mb-2">Failed to load assets</div>
    <div className="text-sm text-muted-foreground mb-4">
      {error?.message || 'Please try again later'}
    </div>
    <Button onClick={onRetry} variant="outline" size="sm">
      Retry
    </Button>
  </div>
);
