'use client';

import { Plus, Search, Sparkles, User } from 'lucide-react';
import { memo } from 'react';

export const EmptyState = memo(({ onCreateClick }: { onCreateClick: () => void }) => {
  return (
    <div className="text-center py-8">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 flex items-center justify-center">
          <Search className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-card-foreground">No Baskts Found</h3>
          <p className="text-muted-foreground max-w-md">
            We couldn't find any baskts matching your search. Try different keywords or create your
            own!
          </p>
        </div>
        <button
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          Create Your Own Baskt
        </button>
      </div>
    </div>
  );
});

export const WalletEmptyState = memo(({ onConnectClick }: { onConnectClick: () => void }) => {
  return (
    <div className="text-center py-8">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 flex items-center justify-center">
          <User className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-card-foreground">Connect Your Wallet</h3>
          <p className="text-muted-foreground max-w-md">
            Please connect your wallet to view your created baskts and manage your portfolio.
          </p>
        </div>
        <button
          onClick={onConnectClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-200"
        >
          <User className="w-4 h-4" />
          Connect Wallet
        </button>
      </div>
    </div>
  );
});

export const NoBasktsCreatedState = memo(({ onCreateClick }: { onCreateClick: () => void }) => {
  return (
    <div className="text-center py-8">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 flex items-center justify-center">
          <User className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-card-foreground">Start Your Baskt Journey</h3>
          <p className="text-muted-foreground max-w-md">
            You haven't created any baskts yet. Create your first baskt and start building your
            portfolio with AI-powered rebalancing!
          </p>
        </div>
        <button
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          Create Your First Baskt
        </button>
      </div>
    </div>
  );
});

export const NoTrendingBasktsState = () => {
  return (
    <div className="text-center py-8">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-card-foreground">
            No Trending Baskts Available
          </h3>
          <p className="text-muted-foreground max-w-md">
            Our AI doesn't detect any trending baskts at the moment.
          </p>
        </div>
        <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
          💡 Check back later for new trending opportunities
        </div>
      </div>
    </div>
  );
};
