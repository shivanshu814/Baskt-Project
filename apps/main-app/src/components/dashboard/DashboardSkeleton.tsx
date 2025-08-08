export const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-9xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="h-8 w-64 bg-muted animate-pulse rounded mb-2"></div>
          <div className="h-4 w-96 bg-muted animate-pulse rounded"></div>
        </div>

        {/* Main Grid Layout - Portfolio Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mb-8">
          {/* Left Column - Stats Cards */}
          <div className="lg:col-span-3 space-y-4">
            {/* Total Portfolio Value Card */}
            <div className="bg-gray border-primary/30 border border rounded-lg p-6 hover:shadow-lg">
              <div className="space-y-4">
                <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
                <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                  <div className="h-6 w-12 bg-muted animate-pulse rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Funds Card */}
            <div className="bg-gray border-primary/30 border border rounded-lg p-6 hover:shadow-lg">
              <div className="space-y-4">
                <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="h-3 w-20 bg-muted animate-pulse rounded mb-1"></div>
                    <div className="h-5 w-16 bg-muted animate-pulse rounded"></div>
                  </div>
                  <div>
                    <div className="h-3 w-24 bg-muted animate-pulse rounded mb-1"></div>
                    <div className="h-5 w-20 bg-muted animate-pulse rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Wallet Breakdown */}
          <div className="lg:col-span-7 bg-gray rounded-lg p-6 border border-primary/30">
            <div className="space-y-4">
              <div className="h-6 w-40 bg-muted rounded"></div>
              <div className="h-48 w-full bg-muted rounded"></div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="mb-2">
          <div className="flex bg-primary/10 border border-primary/30 rounded-lg p-1 gap-1 w-fit">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="px-4 py-2 rounded-md h-8 w-20 bg-muted animate-pulse"
              ></div>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          <div className="bg-gray border-primary/30 border border rounded-lg p-6">
            <div className="space-y-4">
              <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-muted-foreground/10 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-muted animate-pulse rounded-full"></div>
                      <div>
                        <div className="h-4 w-24 bg-muted animate-pulse rounded mb-1"></div>
                        <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 w-20 bg-muted animate-pulse rounded mb-1"></div>
                      <div className="h-3 w-12 bg-muted animate-pulse rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
