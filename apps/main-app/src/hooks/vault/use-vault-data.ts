import { useBasktClient } from '@baskt/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { trpc } from '../../lib/api/trpc';
import { OpenInterestData, VaultData } from '../../types/vault';
import {
  REFETCH_INTERVAL,
  STALE_TIME,
  aggregateAssetExposures,
  calculateExposurePercentages,
  calculateTotalTVL,
  getAssetImageUrl,
  processAssetData,
  processVaultData,
} from '../../utils/vault-data-utils';

// fetch vault data and liquidity pool
export function useVaultData() {
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
      refetchInterval: REFETCH_INTERVAL,
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
    if (vaultDataResponse?.success && 'data' in vaultDataResponse) {
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

// fetch vault exposure data from baskts with open positions
export function useVaultExposure() {
  const {
    data: exposureData,
    isLoading,
    error,
    refetch,
  } = trpc.metrics.getOpenInterestForBasktsWithPositions.useQuery(undefined, {
    refetchInterval: REFETCH_INTERVAL,
    staleTime: STALE_TIME,
  });

  const processedExposureData = useMemo(() => {
    return exposureData?.success && 'data' in exposureData
      ? (exposureData.data as OpenInterestData[])
      : [];
  }, [exposureData]);

  return {
    exposureData: processedExposureData,
    isLoading,
    error,
    refetch,
  };
}

// calculate vault exposure metrics and asset exposure data
export function useVaultExposureCalculations() {
  const { exposureData, isLoading, error } = useVaultExposure();

  const calculatedTvl = useMemo(() => {
    return calculateTotalTVL(exposureData);
  }, [exposureData]);

  const assetExposureData = useMemo(() => {
    return aggregateAssetExposures(exposureData);
  }, [exposureData]);

  return {
    calculatedTvl,
    assetExposureData,
    calculateExposurePercentages,
    getAssetImage: getAssetImageUrl,
    getProcessedAssetData: processAssetData,
    isLoading,
    error,
  };
}
