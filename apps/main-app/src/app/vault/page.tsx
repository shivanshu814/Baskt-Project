'use client';

import { Separator, useBasktClient } from '@baskt/ui';
import { ExposureTable } from '../../components/vault/exposureTable/ExposureTable';
import { TvlDisplay } from '../../components/vault/header/TvlDisplay';
import { VaultInfo } from '../../components/vault/header/VaultInfo';
import { WithdrawQueue } from '../../components/vault/queue/WithdrawQueue';
import { VaultSkeleton } from '../../components/vault/skeleton/VaultSkeleton';
import { VaultActionTabs } from '../../components/vault/tabs/VaultActionTabs';
import { useVaultData } from '../../hooks/vault/use-vault-data';

export default function VaultPage() {
  const { wallet, client } = useBasktClient();

  const {
    data: enhancedVaultData,
    isLoading,
    refetch: refetchEnhancedVaultData,
  } = useVaultData(wallet?.address);

  const isLoggedIn = !!wallet?.address;

  if (isLoading) {
    return <VaultSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 pt-4">
      <div className="w-full max-w-[85rem] mx-auto flex flex-col lg:flex-row gap-8 px-5">
        <div className="flex-1">
          <div className="flex justify-between items-center w-full">
            <VaultInfo apr={enhancedVaultData?.apr || 0} />
          </div>
          <Separator className="-mt-2" />

          <div className="mt-4">
            <TvlDisplay totalValueLocked={enhancedVaultData?.allocation?.totalValueLocked || 0} />
            <ExposureTable allocationData={enhancedVaultData?.allocation?.allocationData || []} />
          </div>

          {isLoggedIn && (
            <div className="mt-6">
              <WithdrawQueue withdrawData={enhancedVaultData?.userWithdraw} />
            </div>
          )}
        </div>

        <div className="w-full lg:w-[400px]">
          <VaultActionTabs
            statistics={enhancedVaultData?.statistics}
            poolData={enhancedVaultData?.poolData}
            liquidityPool={client?.liquidityPoolPDA}
            userWithdrawalData={enhancedVaultData?.userWithdrawalData}
            onVaultOperationSuccess={refetchEnhancedVaultData}
          />
        </div>
      </div>
    </div>
  );
}
