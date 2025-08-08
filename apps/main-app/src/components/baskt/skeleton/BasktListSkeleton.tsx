import { BasktSkeletonCard } from './BasktSkeletonCard';
import { BasktSkeletonControls } from './BasktSkeletonControls';
import { BasktSkeletonHeader } from './BasktSkeletonHeader';

export const BasktListSkeleton = () => {
  return (
    <div>
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col gap-6 sm:gap-8">
          <BasktSkeletonHeader />
          <BasktSkeletonControls />

          <div className="w-full">
            <div className="flex gap-2 mb-4 sm:mb-6">
              <div className="h-10 w-24 bg-muted animate-pulse rounded"></div>
              <div className="h-10 w-24 bg-muted animate-pulse rounded"></div>
            </div>

            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <BasktSkeletonCard key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
