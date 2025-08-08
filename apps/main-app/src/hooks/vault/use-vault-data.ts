import { useBasktClient } from '@baskt/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { trpc } from '../../lib/api/trpc';
import { VaultData } from '../../types/vault';

/**
 * Hook to fetch vault data and liquidity pool
 * @returns The vault data, liquidity pool, loading state, error, and refresh function
 */
export function useVaultData() {
  const { client } = useBasktClient();
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [liquidityPool, setLiquidityPool] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs to track the latest values without causing re-renders
  const clientRef = useRef(client);

  // Update refs when values change
  useEffect(() => {
    clientRef.current = client;
  }, [client]);

  // fetch vault data
  const { data: vaultDataResponse, isLoading: isVaultDataLoading } =
    trpc.pool.getLiquidityPool.useQuery(undefined, {
      refetchInterval: 30 * 1000,
      enabled: true,
    });

  // fetch liquidity pool
  const fetchVaultData = useCallback(async () => {
    if (!clientRef.current) {
      setVaultData(null);
      setError('Client not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const liquidityPoolPDA = await clientRef.current.liquidityPoolPDA;
      setLiquidityPool(liquidityPoolPDA);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch liquidity pool');
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies since we use refs

  // process vault data
  useEffect(() => {
    if (vaultDataResponse?.success && 'data' in vaultDataResponse) {
      const data = vaultDataResponse.data;

      const processedVaultData: VaultData = {
        totalLiquidity: data.totalLiquidity || '0',
        totalShares: data.totalShares || '0',
        depositFeeBps: data.depositFeeBps || 0,
        withdrawalFeeBps: data.withdrawalFeeBps || 0,
        minDeposit: data.minDeposit || '0',
        lastUpdateTimestamp:
          typeof data.lastUpdateTimestamp === 'number'
            ? new Date(data.lastUpdateTimestamp).toISOString()
            : data.lastUpdateTimestamp || new Date().toISOString(),
        lpMint: data.lpMint || '',
        tokenVault: data.tokenVault || '',
        apr: data.apr || '0.00',
        totalFeesEarned: data.totalFeesEarned || '0.00',
        recentFeeData: data.recentFeeData,
        feeStats: data.feeStats,
      };

      setVaultData(processedVaultData);
    } else if (vaultDataResponse && !vaultDataResponse.success) {
      setError('Failed to fetch vault data');
      setVaultData(null);
    }
  }, [vaultDataResponse]);

  // fetch vault data only when client is available
  useEffect(() => {
    if (client) {
      fetchVaultData();
    }
  }, [client, fetchVaultData]);

  // refresh all
  const refreshAll = useCallback(() => {
    fetchVaultData();
  }, [fetchVaultData]);

  return {
    vaultData,
    liquidityPool,
    loading: loading || isVaultDataLoading,
    error,
    refreshAll,
  };
}
