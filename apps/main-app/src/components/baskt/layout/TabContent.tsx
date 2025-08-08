'use client';

import { useRouter } from 'next/navigation';
import { useWallet } from '../../../hooks/wallet/use-wallet';
import { ROUTES } from '../../../routes/route';
import { TabContentProps } from '../../../types/baskt';
import { EmptyState, NoBasktsCreatedState, WalletEmptyState } from '../empty-state/EmptyState';
import { BasktGrid } from './BasktGrid';

export const TabContent = ({
  activeTab,
  filteredBaskts,
  popularBaskts,
  myBaskts,
  userAddress,
}: TabContentProps) => {
  const router = useRouter();
  const { handleLogin } = useWallet();

  if (activeTab === 'all') {
    return (
      <div>
        {filteredBaskts.length === 0 ? (
          <EmptyState onCreateClick={() => router.push(ROUTES.CREATE_BASKT)} />
        ) : (
          <BasktGrid baskts={filteredBaskts} />
        )}
      </div>
    );
  }

  if (activeTab === 'trending') {
    return (
      <div>
        <div className="mb-4 sm:mb-6">
          <BasktGrid baskts={popularBaskts} />
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
            <BasktGrid baskts={myBaskts} />
          )}
        </div>
      </div>
    );
  }

  return null;
};
