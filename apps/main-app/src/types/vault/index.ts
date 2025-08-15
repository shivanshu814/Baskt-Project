import { PublicKey } from '@solana/web3.js';
import { ReactNode } from 'react';

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

export interface UseDepositProps {
  vaultData: VaultData | null;
  liquidityPool: PublicKey | null;
  onSuccess?: () => void;
}

export interface UseWithdrawProps {
  vaultData: VaultData | null;
  liquidityPool: PublicKey | null;
  onSuccess?: () => void;
}

export interface VaultCalculations {
  depositFee: string;
  depositExpectedOutput: string;
  withdrawFee: string;
  withdrawExpectedOutput: string;
  calculateFee: (amount: string, isDeposit: boolean) => string;
  calculateExpectedOutput: (amount: string, isDeposit: boolean) => string;
}

export interface VaultMetrics {
  currentAPR: string;
  tvl: string;
  totalSupply: string;
  blpPrice: string;
  actualTotalSupply: number;
  totalFeesEarned: string;
}

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

export interface UseWithdrawQueueProps {
  userAddress?: string;
  poolId?: string;
}

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
