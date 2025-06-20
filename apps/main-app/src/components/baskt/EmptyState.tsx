import { memo } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@baskt/ui';
import { EmptyStateProps } from '../../types/baskt';

export const EmptyState = memo(({ onCreateClick }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-20 bg-secondary/20 rounded-lg shadow-md border border-border">
    <div className="mb-6">
      <Search className="w-16 h-16 text-muted-foreground" />
    </div>
    <h3 className="text-2xl font-semibold mb-2">No baskts found</h3>
    <p className="text-muted-foreground mb-6 max-w-md text-center">
      We couldn't find any baskts matching your search. Try different keywords or create your own!
    </p>
    <Button onClick={onCreateClick} size="lg">
      <Plus className="mr-2 h-5 w-5" />
      Create Your Own Baskt
    </Button>
  </div>
));
