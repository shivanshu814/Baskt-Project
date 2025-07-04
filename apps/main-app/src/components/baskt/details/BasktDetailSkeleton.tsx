import React from 'react';

export const BasktDetailSkeleton = () => {
  return (
    <div className="min-h-screen pl-4">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          <div className="lg:col-span-8 xl:col-span-9 space-y-2">
            <div className="border-b border-muted-foreground/20">
              <div className="pb-0">
                <div className="flex flex-row items-center justify-between border-b px-4 py-2 gap-3 min-h-0 w-full">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center px-0 py-0 min-w-0">
                      <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
                      <div className="h-5 w-16 bg-muted animate-pulse rounded ml-3"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 text-xs sm:text-sm ml-8">
                    <div className="flex flex-col items-start">
                      <div className="h-3 w-8 bg-muted animate-pulse rounded mb-1"></div>
                      <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="h-3 w-20 bg-muted animate-pulse rounded mb-1"></div>
                      <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="h-3 w-16 bg-muted animate-pulse rounded mb-1"></div>
                      <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-1 sm:p-2">
                <div className="h-[350px] sm:h-[450px] lg:h-[500px] bg-muted animate-pulse rounded"></div>
              </div>
            </div>

            <div className="border-b border-muted-foreground/20">
              <div className="border-b border-muted-foreground/20">
                <div className="flex items-center space-x-4 sm:space-x-6 px-4 overflow-x-auto whitespace-nowrap">
                  {['Composition', 'Position', 'Open Orders', 'Order History', 'Metrics'].map(
                    (tab) => (
                      <div key={tab} className="h-10 w-20 bg-muted animate-pulse rounded"></div>
                    ),
                  )}
                </div>
              </div>
              <div className="p-2 sm:p-4 border-b border-muted-foreground/20">
                <div className="h-64 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            <div className="border border-muted-foreground/20 rounded-lg p-4">
              <div className="space-y-4">
                <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
                <div className="space-y-3">
                  <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
                  <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
                  <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
                </div>
                <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
