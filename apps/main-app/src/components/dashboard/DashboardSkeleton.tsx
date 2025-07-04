import React from 'react';

export const DashboardSkeleton = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 w-64 bg-muted animate-pulse rounded mb-2"></div>
        <div className="h-4 w-96 bg-muted animate-pulse rounded"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="border border-muted-foreground/20 rounded-lg p-6">
          <div className="space-y-4">
            <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
            <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
            <div className="h-12 w-full bg-muted animate-pulse rounded"></div>
          </div>
        </div>

        <div className="border border-muted-foreground/20 rounded-lg p-6">
          <div className="space-y-4">
            <div className="h-4 w-28 bg-muted animate-pulse rounded"></div>
            <div className="h-8 w-20 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
            <div className="h-12 w-full bg-muted animate-pulse rounded"></div>
          </div>
        </div>

        <div className="border border-muted-foreground/20 rounded-lg p-6">
          <div className="space-y-4">
            <div className="h-4 w-36 bg-muted animate-pulse rounded"></div>
            <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
            <div className="h-12 w-full bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="border border-muted-foreground/20 rounded-lg p-6">
          <div className="space-y-4">
            <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>
            <div className="h-64 w-full bg-muted animate-pulse rounded"></div>
          </div>
        </div>

        <div className="border border-muted-foreground/20 rounded-lg p-6">
          <div className="space-y-4">
            <div className="h-6 w-40 bg-muted animate-pulse rounded"></div>
            <div className="h-64 w-full bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="border border-muted-foreground/20 rounded-lg p-6">
          <div className="space-y-4">
            <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-muted-foreground/10 rounded"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-muted animate-pulse rounded-full"></div>
                    <div>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded mb-1"></div>
                      <div className="h-3 w-12 bg-muted animate-pulse rounded"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 w-16 bg-muted animate-pulse rounded mb-1"></div>
                    <div className="h-3 w-10 bg-muted animate-pulse rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-muted-foreground/20 rounded-lg p-6">
          <div className="space-y-4">
            <div className="h-6 w-36 bg-muted animate-pulse rounded"></div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 p-2">
                  <div className="h-8 w-8 bg-muted animate-pulse rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded mb-1"></div>
                    <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
                  </div>
                  <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
