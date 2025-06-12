export const BPS_TO_PERCENT = 100;
export const USDC_DECIMALS = 1_000_000;
export const BASIS_POINT = 1_000_000;
export const MIN_FEE_BPS = 0;
export const MAX_FEE_BPS = 1000;
export const MIN_DEPOSIT_AMOUNT = 100_000;
export const REFRESH_INTERVAL = 10000;

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export const POOL_STATS = [
  {
    label: 'Total Liquidity',
    key: 'totalLiquidity',
    subtext: 'Total amount of liquidity in the pool',
    tooltip: 'The total amount of USDC locked in the liquidity pool',
  },
  {
    label: 'Total Shares',
    key: 'totalShares',
    subtext: 'Total supply of LP tokens',
    tooltip: 'The total number of LP tokens in circulation',
  },
  {
    label: 'Deposit Fee',
    key: 'depositFee',
    subtext: 'Fee on deposits',
    tooltip: 'The fee charged when depositing into the pool',
  },
  {
    label: 'Withdrawal Fee',
    key: 'withdrawalFee',
    subtext: 'Fee on withdrawals',
    tooltip: 'The fee charged when withdrawing from the pool',
  },
] as const;
