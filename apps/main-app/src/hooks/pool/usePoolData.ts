import { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useBasktClient } from '@baskt/ui';
import { trpc } from '../../utils/trpc';
import { useToast } from '../common/use-toast';
import type { PoolData, PoolResponse } from '../../types/pool';
import { usePoolCalculations } from './usePoolCalculations';

export const usePoolData = () => {
  const { client } = useBasktClient();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [liquidityPool, setLiquidityPool] = useState<PublicKey | null>(null);

  const { data: poolDataResponse } = trpc.pool.getLiquidityPool.useQuery<PoolResponse>();
  const { calculateFee, calculateExpectedOutput } = usePoolCalculations({ poolData });

  const fetchPoolData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!client) return;
      const liquidityPoolPDA = await client.findLiquidityPoolPDA();
      setLiquidityPool(liquidityPoolPDA);
    } catch (error) {
      toast({
        title: 'Failed to fetch pool data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [client, toast]);

  useEffect(() => {
    if (poolDataResponse?.success) {
      setPoolData({
        totalLiquidity: poolDataResponse.data.totalLiquidity,
        totalShares: poolDataResponse.data.totalShares,
        depositFeeBps: poolDataResponse.data.depositFeeBps,
        withdrawalFeeBps: poolDataResponse.data.withdrawalFeeBps,
        minDeposit: poolDataResponse.data.minDeposit,
        lastUpdateTimestamp: new Date(poolDataResponse.data.lastUpdateTimestamp).toISOString(),
        lpMint: poolDataResponse.data.lpMint,
        tokenVault: poolDataResponse.data.tokenVault,
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
