import { BPS_TO_PERCENT } from '../constants/pool';

export const formatPoolValue = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals);
};

export const formatDate = (timestamp: number): string => {
  if (timestamp <= 0) return '-';
  const date = new Date(timestamp * 1000);
  return date.toISOString().split('T')[0];
};

export const formatUSDC = (value: number): string => {
  return `${formatPoolValue(value)} USDC`;
};

export const formatLP = (value: number): string => {
  return `${formatPoolValue(value)} LP`;
};

export const formatPercentage = (value: number): string => {
  return `${formatPoolValue(value)}%`;
};

export const formatBasisPoints = (value: number): string => {
  return `${formatPoolValue(value / BPS_TO_PERCENT)}%`;
};

export const formatPoolData = (poolData: {
  totalLiquidity: number;
  totalShares: number;
  depositFee: number;
  withdrawalFee: number;
  minDeposit: number;
  lastUpdateTimestamp: number;
  bump: number;
  lpMint: string;
  tokenVault: string;
  depositFeeBps: number;
  withdrawalFeeBps: number;
}) => {
  return {
    totalLiquidity: formatUSDC(poolData.totalLiquidity),
    totalShares: formatLP(poolData.totalShares),
    depositFee: formatBasisPoints(poolData.depositFeeBps),
    withdrawalFee: formatBasisPoints(poolData.withdrawalFeeBps),
    minDeposit: formatUSDC(poolData.minDeposit),
    lastUpdate: formatDate(poolData.lastUpdateTimestamp),
    bump: poolData.bump,
    lpMint: poolData.lpMint,
    tokenVault: poolData.tokenVault,
  };
};
