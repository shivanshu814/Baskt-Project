'use client';

import React from 'react';

export const BasktSkeletonControls = React.memo(() => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      <div className="h-10 w-full sm:w-80 bg-muted animate-pulse rounded"></div>
      <div className="h-10 w-32 bg-muted animate-pulse rounded"></div>
    </div>
  );
});

BasktSkeletonControls.displayName = 'BasktSkeletonControls';
