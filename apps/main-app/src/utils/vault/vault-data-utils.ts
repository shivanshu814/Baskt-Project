import { EnhancedPoolData, VaultData } from '../../types/vault';

export const processVaultData = (data: any): VaultData => {
  return {
    totalLiquidity: data.totalLiquidity || '0',
    totalShares: data.totalShares || '0',
    depositFeeBps: data.depositFeeBps || 0,
    withdrawalFeeBps: data.withdrawalFeeBps || 0,
    minDeposit: data.minDeposit || '0',
    lastUpdateTimestamp: processTimestamp(data.lastUpdateTimestamp),
    lpMint: data.lpMint || '',
    tokenVault: data.tokenVault || '',
    apr: data.apr || '0.00',
    totalFeesEarned: data.totalFeesEarned || '0.00',
    recentFeeData: data.recentFeeData,
    feeStats: data.feeStats,
  };
};

export const processEnhancedPoolData = (data: any): EnhancedPoolData => {
  return {
    totalLiquidity: data.totalLiquidity || '0',
    totalShares: data.totalShares || '0',
    depositFeeBps: data.depositFeeBps || 0,
    withdrawalFeeBps: data.withdrawalFeeBps || 0,
    minDeposit: data.minDeposit || '0',
    lastUpdateTimestamp: data.lastUpdateTimestamp || 0,
    lpMint: data.lpMint || '',
    tokenVault: data.tokenVault || '',
    apr: data.apr || 0,
    totalFeesEarned: data.totalFeesEarned || '0.00',
    recentFeeData: data.recentFeeData,
    feeStats: data.feeStats,
    bump: data.bump || 0,
    poolAuthorityBump: data.poolAuthorityBump || 0,
    pendingLpTokens: data.pendingLpTokens || '0',
    withdrawQueueHead: data.withdrawQueueHead || 0,
    withdrawQueueTail: data.withdrawQueueTail || 0,
    poolAddress: data.poolAddress || '',
  };
};

export const processTimestamp = (timestamp: number | string | undefined): string => {
  if (typeof timestamp === 'number') {
    return new Date(timestamp).toISOString();
  }
  return timestamp || new Date().toISOString();
};
