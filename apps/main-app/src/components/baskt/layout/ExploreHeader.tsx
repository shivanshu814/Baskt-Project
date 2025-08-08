'use client';

import { Button } from '@baskt/ui';
import Link from 'next/link';
import { ROUTES } from '../../../routes/route';

export const ExploreHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="w-full sm:w-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-br from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
          Explore Baskts
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Discover and trade curated crypto index products.
        </p>
      </div>

      <Link href={ROUTES.CREATE_BASKT}>
        <Button
          variant="outline"
          size="sm"
          className="bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10"
        >
          Launch Baskt
        </Button>
      </Link>
    </div>
  );
};
