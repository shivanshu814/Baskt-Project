'use client';

import React from 'react';

export const BasktSkeletonHeader = React.memo(() => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="w-full sm:w-auto">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2"></div>
        <div className="h-4 w-64 bg-muted animate-pulse rounded"></div>
      </div>
      <div className="h-10 w-32 bg-muted animate-pulse rounded"></div>
    </div>
  );
});

BasktSkeletonHeader.displayName = 'BasktSkeletonHeader';
