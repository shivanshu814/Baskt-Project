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

            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-border bg-background/80 p-2">
                  <div className="flex w-full items-center justify-between gap-3 min-h-[64px]">
                    <div className="h-6 w-6 border border-border rounded-md bg-muted animate-pulse"></div>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1 mb-1.5">
                          <div className="h-5 w-24 bg-muted animate-pulse rounded"></div>
                          <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex -space-x-2">
                            <div className="h-7 w-7 rounded-full bg-muted animate-pulse border border-border"></div>
                            <div className="h-7 w-7 rounded-full bg-muted animate-pulse border border-border"></div>
                            <div className="h-7 w-7 rounded-full bg-muted animate-pulse border border-border ml-1 flex items-center justify-center">
                              <div className="h-3 w-3 bg-muted-foreground animate-pulse rounded"></div>
                            </div>
                          </div>
                          <div className="h-3 w-12 bg-muted animate-pulse rounded"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-right justify-end flex-1 mr-4">
                      <div className="flex flex-col items-right">
                        <div className="h-6 w-16 bg-muted animate-pulse rounded mb-1"></div>
                        <div className="h-3 w-12 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>
                    <div className="h-8 w-16 bg-muted animate-pulse rounded mr-4"></div>
                  </div>
                  <div className="flex flex-wrap gap-2 gap-y-2 mb-4 items-center w-full overflow-x-auto justify-between mt-8 px-2">
                    {Array.from({ length: 5 }).map((_, metricIndex) => (
                      <div
                        key={metricIndex}
                        className="flex-1 min-w-[110px] max-w-[180px] flex flex-col items-center bg-muted/30 rounded-md px-2 sm:px-3 py-2 text-center"
                        style={{ flexBasis: '120px' }}
                      >
                        <div className="h-3 w-8 bg-muted animate-pulse rounded mb-1"></div>
                        <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 rounded-lg border border-border bg-muted/10 overflow-x-auto px-2 sm:px-4 pb-3">
                    <div className="min-w-[600px]">
                      <div className="flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-muted-foreground">
                        <span className="flex-1 text-left">
                          <div className="h-3 w-8 bg-muted animate-pulse rounded"></div>
                        </span>
                        <span className="flex-1 text-center">
                          <div className="h-3 w-8 bg-muted animate-pulse rounded"></div>
                        </span>
                        <span className="flex-1 text-center">
                          <div className="h-3 w-12 bg-muted animate-pulse rounded"></div>
                        </span>
                        <span className="flex-1 text-center whitespace-nowrap">
                          <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                        </span>
                        <span className="flex-1 text-right whitespace-nowrap">
                          <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                        </span>
                      </div>

                      {Array.from({ length: 3 }).map((_, assetIndex) => (
                        <div
                          key={assetIndex}
                          className="flex items-center px-2 sm:px-3 py-2 border-t border-border bg-background/80 text-xs sm:text-sm"
                        >
                          <span className="flex-1 flex items-center">
                            <span className="mr-2">
                              <div className="h-7 w-7 rounded-full bg-muted animate-pulse border border-border"></div>
                            </span>
                            <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                          </span>
                          <span className="flex-1 text-center">
                            <div className="h-3 w-12 bg-muted animate-pulse rounded"></div>
                          </span>
                          <span className="flex-1 text-center">
                            <div className="h-3 w-8 bg-muted animate-pulse rounded"></div>
                          </span>
                          <span className="flex-1 text-center">
                            <div className="h-3 w-10 bg-muted animate-pulse rounded"></div>
                          </span>
                          <span className="flex-1 text-right">
                            <div className="h-3 w-10 bg-muted animate-pulse rounded"></div>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
