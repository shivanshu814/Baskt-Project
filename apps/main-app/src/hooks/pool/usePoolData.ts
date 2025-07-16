import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useBasktClient } from '@baskt/ui';
import { toast } from 'sonner';
import { trpc } from '../../utils/common/trpc';
import type { PoolData, PoolResponse } from '../../types/pool';
import { usePoolCalculations } from './usePoolCalculations';

export const usePoolData = () => {
  const { client } = useBasktClient();
  const [isLoading, setIsLoading] = useState(false);
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [liquidityPool, setLiquidityPool] = useState<PublicKey | null>(null);

  const { data: poolDataResponse } = trpc.pool.getLiquidityPool.useQuery();
  const { calculateFee, calculateExpectedOutput } = usePoolCalculations({ poolData });

  const fetchPoolData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!client) return;
      const liquidityPoolPDA = await client.findLiquidityPoolPDA();
      setLiquidityPool(liquidityPoolPDA);
    } catch (error) {
      toast.error('Failed to fetch pool data');
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (poolDataResponse?.success && 'data' in poolDataResponse) {
      const data = poolDataResponse.data;
      setPoolData({
        totalLiquidity: data.totalLiquidity,
        totalShares: data.totalShares,
        depositFeeBps: data.depositFeeBps,
        withdrawalFeeBps: data.withdrawalFeeBps,
        minDeposit: data.minDeposit,
        lastUpdateTimestamp: new Date(data.lastUpdateTimestamp).toISOString(),
        lpMint: data.lpMint,
        tokenVault: data.tokenVault,
        // Include new fee and APR fields
        apr: data.apr || '0.00',
        totalFeesEarned: data.totalFeesEarned || '0.00',
        recentFeeData: data.recentFeeData,
        feeStats: data.feeStats,
      });
    }
  }, [poolDataResponse]);

  useEffect(() => {
    fetchPoolData();
  }, [fetchPoolData]);

  return {
    poolData,
    liquidityPool,
    isLoading,
    calculateFee,
    calculateExpectedOutput,
    fetchPoolData,
  };
};
