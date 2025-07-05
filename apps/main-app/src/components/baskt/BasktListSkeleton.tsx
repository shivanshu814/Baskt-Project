import React from 'react';

export const BasktListSkeleton = () => {
  return (
    <div>
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col gap-6 sm:gap-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2"></div>
              <div className="h-4 w-64 bg-muted animate-pulse rounded"></div>
            </div>
            <div className="h-10 w-32 bg-muted animate-pulse rounded"></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="h-10 w-full sm:w-80 bg-muted animate-pulse rounded"></div>
            <div className="h-10 w-32 bg-muted animate-pulse rounded"></div>
          </div>

          <div className="w-full">
            <div className="flex gap-2 mb-4 sm:mb-6">
              <div className="h-10 w-24 bg-muted animate-pulse rounded"></div>
              <div className="h-10 w-24 bg-muted animate-pulse rounded"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="border border-muted-foreground/20 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted animate-pulse rounded-full"></div>
                      <div>
                        <div className="h-4 w-20 bg-muted animate-pulse rounded mb-1"></div>
                        <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>
                    <div className="h-6 w-12 bg-muted animate-pulse rounded"></div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-5 w-16 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <div className="h-3 w-8 bg-muted animate-pulse rounded mb-1"></div>
                      <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
                    </div>
                    <div>
                      <div className="h-3 w-12 bg-muted animate-pulse rounded mb-1"></div>
                      <div className="h-4 w-10 bg-muted animate-pulse rounded"></div>
                    </div>
                  </div>

                  <div className="h-16 w-full bg-muted animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
