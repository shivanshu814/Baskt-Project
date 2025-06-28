import { memo } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@baskt/ui';
import { EmptyStateProps } from '../../types/baskt';

export const EmptyState = memo(({ onCreateClick }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 sm:py-20 bg-secondary/20 rounded-lg shadow-md border border-border px-4">
    <div className="mb-4 sm:mb-6">
      <Search className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
    </div>
    <h3 className="text-xl sm:text-2xl font-semibold mb-2 text-center">No baskts found</h3>
    <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md text-center">
      We couldn't find any baskts matching your search. Try different keywords or create your own!
    </p>
    <Button onClick={onCreateClick} size="lg" className="text-sm sm:text-base">
      <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
      Create Your Own Baskt
    </Button>
  </div>
));
