import { useCallback } from 'react';
import { usePoolData } from './usePoolData';
import { useUSDCBalance } from './useUSDCBalance';
import { useTokenBalance } from './useTokenBalance';
import { useBasktClient } from '@baskt/ui';

export const usePoolRefresh = () => {
  const { wallet } = useBasktClient();
  const { poolData, fetchPoolData } = usePoolData();
  const { refetch: refetchUSDCBalance } = useUSDCBalance();
  const { refetch: refetchLpBalance } = useTokenBalance(
    poolData?.lpMint ?? '',
    wallet?.address ?? '',
  );

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchPoolData(), refetchUSDCBalance(), refetchLpBalance()]);
  }, [fetchPoolData, refetchUSDCBalance, refetchLpBalance]);

  return {
    refreshAll,
  };
};
