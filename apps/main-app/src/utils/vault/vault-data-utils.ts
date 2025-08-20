import { VaultData } from '../../types/vault';

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

export const processTimestamp = (timestamp: number | string | undefined): string => {
  if (typeof timestamp === 'number') {
    return new Date(timestamp).toISOString();
  }
  return timestamp || new Date().toISOString();
};
