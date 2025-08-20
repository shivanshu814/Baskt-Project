import { useBasktClient } from '@baskt/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { trpc } from '../../lib/api/trpc';
import { VaultData } from '../../types/vault';
import { processVaultData } from '../../utils/vault/vault-data-utils';

// fetch vault data and liquidity pool
export function useLiquidityPool() {
  const { client } = useBasktClient();
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [liquidityPool, setLiquidityPool] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef(client);

  useEffect(() => {
    clientRef.current = client;
  }, [client]);

  const { data: vaultDataResponse, isLoading: isVaultDataLoading } =
    trpc.pool.getLiquidityPool.useQuery(undefined, {
      refetchInterval: false,
      enabled: true,
    });

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
  }, []);

  useEffect(() => {
    const hasData = vaultDataResponse && 'data' in vaultDataResponse;

    if (vaultDataResponse?.success && hasData) {
      const processedData = processVaultData(vaultDataResponse.data);
      setVaultData(processedData);
    } else if (vaultDataResponse && !vaultDataResponse.success) {
      setError('Failed to fetch vault data');
      setVaultData(null);
    }
  }, [vaultDataResponse]);

  useEffect(() => {
    if (client) {
      fetchVaultData();
    }
  }, [client, fetchVaultData]);

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
