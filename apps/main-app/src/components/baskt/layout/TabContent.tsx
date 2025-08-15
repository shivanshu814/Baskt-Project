'use client';

import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { useWallet } from '../../../hooks/wallet/use-wallet';
import { ROUTES } from '../../../routes/route';
import { TabContentProps } from '../../../types/baskt';
import { BasktCard } from '../card/BasktCard';
import { EmptyState, NoBasktsCreatedState, WalletEmptyState } from '../empty-state/EmptyState';

export const TabContent = ({
  activeTab,
  filteredBaskts,
  popularBaskts,
  myBaskts,
  userAddress,
}: TabContentProps) => {
  const router = useRouter();
  const { handleLogin } = useWallet();

  const BasktGridInline = memo(({ baskts }: { baskts: typeof filteredBaskts }) => (
    <div className="space-y-6">
      {baskts.map((baskt) => (
        <BasktCard
          key={baskt.basktId.toString()}
          baskt={baskt}
          className="hover:shadow-lg transition-all duration-200"
        />
      ))}
    </div>
  ));

  if (activeTab === 'all') {
    return (
      <div>
        {filteredBaskts.length === 0 ? (
          <EmptyState onCreateClick={() => router.push(ROUTES.CREATE_BASKT)} />
        ) : (
          <BasktGridInline baskts={filteredBaskts} />
        )}
      </div>
    );
  }

  if (activeTab === 'trending') {
    return (
      <div>
        <div className="mb-4 sm:mb-6">
          <BasktGridInline baskts={popularBaskts} />
        </div>
      </div>
    );
  }

  if (activeTab === 'your') {
    return (
      <div>
        <div className="mb-4 sm:mb-6">
          {!userAddress ? (
            <WalletEmptyState onConnectClick={handleLogin} />
          ) : myBaskts.length === 0 ? (
            <NoBasktsCreatedState onCreateClick={() => router.push(ROUTES.CREATE_BASKT)} />
          ) : (
            <BasktGridInline baskts={myBaskts} />
          )}
        </div>
      </div>
    );
  }

  return null;
};
