'use client';

export const AssetSkeleton = () => (
  <div className="border border-border/30 rounded-lg p-3 min-h-[100px] bg-card/30 animate-pulse">
    <div className="flex items-center h-full p-2">
      <div className="h-10 w-10 rounded-full bg-muted/30 mr-3" />
      <div className="flex-1">
        <div className="h-4 bg-muted/30 rounded mb-2" />
        <div className="h-3 bg-muted/30 rounded w-3/4" />
      </div>
      <div className="flex flex-col items-end">
        <div className="h-3 bg-muted/30 rounded w-12 mb-1" />
        <div className="h-3 bg-muted/30 rounded w-16" />
      </div>
    </div>
  </div>
);
