const StaticSkeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={`rounded-md bg-muted ${className || ''}`}
      style={{
        animation: 'subtle-pulse 3s ease-in-out infinite',
      }}
      {...props}
    />
  );
};

export const VaultSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 pt-4">
      <style jsx>{`
        @keyframes subtle-pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
      <div className="w-full max-w-[85rem] mx-auto flex flex-col lg:flex-row gap-8 px-5">
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <StaticSkeleton className="h-10 w-32" />
              <StaticSkeleton className="h-5 w-96" />
            </div>

            <div className="space-y-3 text-right">
              <div className="space-y-2">
                <div className="flex items-center gap-2 justify-end">
                  <StaticSkeleton className="h-5 w-12 " />
                  <StaticSkeleton className="h-4 w-4 rounded-full" />
                </div>
                <div className="flex flex-col items-end">
                  <StaticSkeleton className="h-8 w-20 mb-2" />
                  <StaticSkeleton className="h-4 w-48" />
                </div>
              </div>
            </div>
          </div>
          <div className="h-px bg-border mt-3" />

          <div className="mt-6 space-y-4">
            <StaticSkeleton className="h-7 w-48" />
            <div className="flex justify-between items-start">
              <div></div>
              <div className="space-y-2 -mt-8">
                <StaticSkeleton className="h-5 w-36" />
                <StaticSkeleton className="h-8 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 p-3 border border-border/30 rounded-lg bg-card/50">
              <StaticSkeleton className="h-5 w-16" />
              <StaticSkeleton className="h-5 w-28" />
              <StaticSkeleton className="h-5 w-28" />
              <StaticSkeleton className="h-5 w-28" />
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-4 p-3 border border-border/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <StaticSkeleton className="h-8 w-8 rounded-full" />
                  <StaticSkeleton className="h-5 w-20" />
                </div>
                <div className="space-y-1">
                  <StaticSkeleton className="h-5 w-24" />
                  <StaticSkeleton className="h-4 w-12" />
                </div>
                <div className="space-y-1">
                  <StaticSkeleton className="h-5 w-20" />
                  <StaticSkeleton className="h-4 w-8" />
                </div>
                <div className="space-y-1">
                  <StaticSkeleton className="h-5 w-24" />
                  <StaticSkeleton className="h-4 w-16" />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 p-3 border border-border/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <StaticSkeleton className="h-8 w-8 rounded-full" />
                  <StaticSkeleton className="h-5 w-20" />
                </div>
                <div className="space-y-1">
                  <StaticSkeleton className="h-5 w-20" />
                  <StaticSkeleton className="h-4 w-8" />
                </div>
                <div className="space-y-1">
                  <StaticSkeleton className="h-5 w-24" />
                  <StaticSkeleton className="h-4 w-12" />
                </div>
                <div className="space-y-1">
                  <StaticSkeleton className="h-5 w-24" />
                  <StaticSkeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[400px]">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <StaticSkeleton className="h-10 w-24 rounded-lg" />
                <StaticSkeleton className="h-10 w-24 rounded-lg" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <StaticSkeleton className="h-5 w-5" />
                  <StaticSkeleton className="h-6 w-20" />
                </div>
                <StaticSkeleton className="h-4 w-48" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 border border-border/30 rounded-lg">
                    <StaticSkeleton className="h-5 flex-1" />
                    <StaticSkeleton className="h-6 w-12" />
                    <StaticSkeleton className="h-5 w-16" />
                  </div>
                  <StaticSkeleton className="h-4 w-32" />
                </div>
                <div className="space-y-2">
                  <StaticSkeleton className="h-4 w-32" />
                  <StaticSkeleton className="h-5 w-24" />
                  <StaticSkeleton className="h-4 w-24" />
                </div>
                <StaticSkeleton className="h-12 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
