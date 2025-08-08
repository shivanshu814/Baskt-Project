'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { TrendingBannerProps } from '../../../types/baskt';

export const TrendingBanner = ({ onReviewClick }: TrendingBannerProps) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-3 mb-4 rounded-lg border border-border bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-violet-500/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
            Baskt AI detected top trending baskts you might view and trade them
          </span>
        </div>
        <button
          onClick={onReviewClick}
          className="text-sm font-medium underline flex items-center gap-1 transition-colors duration-200 bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent hover:from-pink-600 hover:via-purple-600 hover:to-violet-600"
        >
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1">Review Trending Baskts Now</div>
            <div className="flex items-center gap-1">
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
