'use client';

import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { useWallet } from '../../../hooks/wallet/use-wallet';
import { ROUTES } from '../../../routes/route';
import { TabContentProps } from '../../../types/baskt';
import { BasktCard } from '../card/BasktCard';
import {
  EmptyState,
  NoBasktsCreatedState,
  NoTrendingBasktsState,
  WalletEmptyState,
} from '../empty-state/EmptyState';
import { BasktListSkeleton } from '../skeleton/BasktListSkeleton';

export const TabContent = ({
  activeTab,
  filteredBaskts = [],
  trendingBaskts = [],
  yourBaskts = [],
  userAddress,
  isLoading = false,
}: TabContentProps) => {
  const router = useRouter();
  const { handleLogin } = useWallet();

  const BasktGridInline = memo(({ baskts }: { baskts: typeof filteredBaskts }) => (
    <div className="space-y-6">
      {baskts.map((baskt) => (
        <BasktCard
          key={baskt.baskt.basktId?.toString()}
          baskt={baskt}
          className="hover:shadow-lg transition-all duration-200"
        />
      ))}
    </div>
  ));

  if (activeTab === 'all') {
    return filteredBaskts.length === 0 ? (
      <EmptyState onCreateClick={() => router.push(ROUTES.CREATE_BASKT)} />
    ) : (
      <BasktGridInline baskts={filteredBaskts} />
    );
  }

  if (activeTab === 'trending') {
    if (isLoading) {
      return <BasktListSkeleton />;
    }
    return trendingBaskts.length === 0 ? (
      <NoTrendingBasktsState />
    ) : (
      <BasktGridInline baskts={trendingBaskts} />
    );
  }

  if (activeTab === 'your') {
    return !userAddress ? (
      <WalletEmptyState onConnectClick={handleLogin} />
    ) : yourBaskts.length === 0 ? (
      <NoBasktsCreatedState onCreateClick={() => router.push(ROUTES.CREATE_BASKT)} />
    ) : (
      <BasktGridInline baskts={yourBaskts} />
    );
  }

  return null;
};
