import { useBasktClient } from '@baskt/ui';
import { useCallback } from 'react';
import { trpc } from '../../lib/api/trpc';
import { EnhancedPoolData, EnhancedVaultData } from '../../types/vault';
import { processEnhancedPoolData } from '../../utils/vault/vault-data-utils';

export function useVaultData(userAddress?: string) {
  const { client } = useBasktClient();
  const targetUserAddress = userAddress || client?.wallet?.address?.toString();

  const vaultQuery = trpc.vault.getVaultData.useQuery(
    targetUserAddress ? { userAddress: targetUserAddress } : {},
    {
      enabled: true,
      refetchInterval: false,
      refetchIntervalInBackground: false,
      staleTime: 5 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  );

  const isUserData = !!targetUserAddress;
  const isPublicData = !targetUserAddress;

  const data: EnhancedVaultData | null =
    vaultQuery.data?.success && 'data' in vaultQuery.data ? vaultQuery.data.data : null;
  const poolData: EnhancedPoolData | null = data?.poolData
    ? processEnhancedPoolData(data.poolData)
    : null;

  const liquidityPool = client?.liquidityPoolPDA || null;

  const delayedRefetch = useCallback(() => {
    setTimeout(() => {
      vaultQuery.refetch();
    }, 15 * 1000);
  }, [vaultQuery.refetch]);

  return {
    data,
    poolData,
    liquidityPool,
    isLoading: vaultQuery.isLoading,
    isError: vaultQuery.isError,
    error: vaultQuery.error,
    refetch: delayedRefetch,
    isUserData,
    isPublicData,
    hasWallet: !!client?.wallet?.address,
    userAddress: targetUserAddress,
  };
}
