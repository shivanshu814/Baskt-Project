import { PublicKey } from '@solana/web3.js';
import { ReactNode } from 'react';

// vault data
export interface VaultData {
  totalLiquidity: string;
  totalShares: string;
  depositFeeBps: number;
  withdrawalFeeBps: number;
  minDeposit: string;
  lastUpdateTimestamp: string;
  lpMint: string;
  tokenVault: string;
  apr: string;
  totalFeesEarned: string;
  recentFeeData?: {
    totalFees?: string;
    totalFeesToBlp?: string;
    eventCount: number;
    timeWindowDays: number;
  };
  feeStats?: {
    totalEvents: number;
    totalFees: number;
    totalFeesToTreasury: number;
    totalFeesToBlp: number;
    eventTypeBreakdown: Array<{
      _id: string;
      count: number;
      totalFeesToTreasury: number;
      totalFeesToBlp: number;
      totalFees: number;
      avgLiquidityAmount?: number;
    }>;
  };
}
// vault response
export type VaultResponse =
  | {
      success: true;
      data: {
        totalLiquidity: string;
        totalShares: string;
        depositFeeBps: number;
        withdrawalFeeBps: number;
        minDeposit: string;
        lastUpdateTimestamp: number;
        lpMint: string;
        tokenVault: string;
        bump: number;
        apr: string;
        totalFeesEarned: string;
        recentFeeData?: {
          totalFees?: string;
          totalFeesToBlp?: string;
          eventCount: number;
          timeWindowDays: number;
        };
        feeStats?: {
          totalEvents: number;
          totalFees: number;
          totalFeesToTreasury: number;
          totalFeesToBlp: number;
          eventTypeBreakdown: Array<{
            _id: string;
            count: number;
            totalFeesToTreasury: number;
            totalFeesToBlp: number;
            totalFees: number;
            avgLiquidityAmount?: number;
          }>;
        };
      };
    }
  | {
      success: false;
      error: string;
    };
// action card props
export interface ActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  inputValue: string;
  setInputValue: (v: string) => void;
  onAction: () => void;
  actionLabel: string;
  loading: boolean;
  color: 'green' | 'red';
  disabled: boolean;
  fee?: string;
  onMaxClick?: () => void;
  expectedOutput?: string;
  unit: string;
  tokenBalance: string;
  queueInfo?: {
    userQueuePosition?: number;
    estimatedWaitTime?: number;
    totalQueueItems: number;
  };
}
// token allocation
export interface TokenAllocation {
  symbol: string;
  name: string;
  image: string;
  poolSize: {
    usd: string;
    amount: string;
  };
  weightage: {
    current: string;
    target: string;
  };
  utilization: string;
  longExposure: {
    usd: string;
    percentage: string;
  };
  shortExposure: {
    usd: string;
    percentage: string;
  };
}
// liquidity allocation props
export interface LiquidityAllocationProps {
  tvl: string;
}
// vault deposit props
export interface VaultDepositProps {
  depositAmount: string;
  setDepositAmount: (amount: string) => void;
  isDepositing: boolean;
  isDepositValid: boolean;
  handleDeposit: () => Promise<void>;
  usdcBalance: string;
  calculateFee: (amount: string, isDeposit: boolean) => string;
  calculateExpectedOutput: (amount: string, isDeposit: boolean) => string;
}
// vault info props
export interface VaultInfoProps {
  apy: string;
  lastUpdated: string;
}
// vault withdraw props
export interface VaultWithdrawProps {
  withdrawAmount: string;
  setWithdrawAmount: (amount: string) => void;
  isWithdrawing: boolean;
  isWithdrawValid: boolean;
  handleWithdraw: () => Promise<void>;
  lpBalance: string;
  calculateFee: (amount: string, isDeposit: boolean) => string;
  calculateExpectedOutput: (amount: string, isDeposit: boolean) => string;
}
// stat card props
export interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: ReactNode;
  tooltip?: string;
  trend?: { value: number; isPositive: boolean };
}
// use deposit props
export interface UseDepositProps {
  vaultData: VaultData | null;
  liquidityPool: PublicKey | null;
  onSuccess?: () => void;
}
// use vault calculations props
export interface UseVaultCalculationsProps {
  vaultData: VaultData | null;
}
// use user balances props
export interface UseUserBalancesProps {
  vaultData: {
    lpMint: string;
  } | null;
}
// use withdraw props
export interface UseWithdrawProps {
  vaultData: VaultData | null;
  liquidityPool: PublicKey | null;
  onSuccess?: () => void;
}
// vault calculations
export interface VaultCalculations {
  depositFee: string;
  depositExpectedOutput: string;
  withdrawFee: string;
  withdrawExpectedOutput: string;
  calculateFee: (amount: string, isDeposit: boolean) => string;
  calculateExpectedOutput: (amount: string, isDeposit: boolean) => string;
}
// vault metrics
export interface VaultMetrics {
  currentAPR: string;
  tvl: string;
  totalSupply: string;
  blpPrice: string;
  actualTotalSupply: number;
  totalFeesEarned: string;
}
// vault stats card props
export interface VaultStatsCardProps {
  vaultMetrics: VaultMetrics;
}
// asset exposure
export interface AssetExposure {
  ticker?: string;
  name?: string;
  logo?: string;
  longExposure?: number;
  shortExposure?: number;
  netExposure?: number;
  weight?: number;
  direction?: boolean;
  assetId?: string;
}

// open interest data from API
export interface OpenInterestData {
  totalOpenInterest: number;
  totalPositions: number;
  longOpenInterest: number;
  shortOpenInterest: number;
  longPositions: any[];
  shortPositions: any[];
  basktId: string;
  basktName: string;
  basktCreator: string;
  assetExposures: AssetExposure[];
}
// vault action tabs props
export interface VaultActionTabsProps {
  vaultData: VaultData | null;
  liquidityPool: PublicKey | null;
}
// asset exposure row props
export interface AssetExposureRowProps {
  asset: AssetExposure;
}
// use vault tabs return
export interface UseVaultTabsReturn {
  activeTab: 'deposit' | 'withdraw';
  handleTabChange: (value: string) => void;
  handleMaxDeposit: () => void;
  handleMaxWithdraw: () => void;
}
export interface WithdrawQueueProps {
  poolId: string;
  userAddress?: string;
}
// use withdraw queue props
export interface UseWithdrawQueueProps {
  userAddress?: string;
  poolId?: string;
}
// withdraw queue item
export interface WithdrawQueueItem {
  id: string;
  poolId: string;
  providerAddress: string;
  lpAmount: string;
  remainingLp: string;
  providerTokenAccount: string;
  queuePosition: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  requestedAt: string;
  processedAt?: string;
  amountProcessed?: string;
  feeCollected?: string;
  tx: string;
  processedTx?: string;
}
// withdraw queue stats
export interface WithdrawQueueStats {
  totalQueueItems: number;
  averageProcessingTime: number;
  queueProcessingRate: number;
  estimatedWaitTime?: number;
  userQueuePosition?: number;
  nextProcessingTime?: string;
  processingInterval?: number;
  isProcessingNow?: boolean;
}

export interface VaultActionTabsProps {
  vaultData: VaultData | null;
  liquidityPool: PublicKey | null;
}
