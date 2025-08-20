'use client';

import Link from 'next/link';
import { ROUTES } from '../../routes/route';

export const PortfolioHeader = () => {
  return (
    <header className="bg-none">
      <div className="container mx-auto px-2 py-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-br from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
              Portfolio
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Your <span className="text-purple-500 font-medium">baskts</span>. Your performance.
              All in one place.
            </p>
          </div>
          <Link href={ROUTES.EXPLORE}>
            <button className="bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 border px-4 py-2 rounded-lg text-sm font-medium text-primary flex items-center gap-2">
              Explore Baskts
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
};
