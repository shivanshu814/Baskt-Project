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
    eventCount?: number;
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

export interface EnhancedPoolData {
  totalLiquidity: string;
  totalShares: string;
  depositFeeBps: number;
  withdrawalFeeBps: number;
  minDeposit: string;
  lastUpdateTimestamp: number;
  lpMint: string;
  tokenVault: string;
  apr: number;
  totalFeesEarned: string;
  recentFeeData?: {
    totalFees?: string;
    totalFeesToBlp?: string;
    eventCount?: number;
    timeWindowDays: number;
  };
  feeStats?: {
    totalEvents?: number;
    totalFees?: number;
    totalFeesToTreasury?: number;
    totalFeesToBlp?: number;
    eventTypeBreakdown?: Array<{
      _id: string;
      count: number;
      totalFeesToTreasury: number;
      totalFeesToBlp: number;
      totalFees: number;
      avgLiquidityAmount?: number;
    }>;
  } | null;
  bump: number;
  poolAuthorityBump: number;
  pendingLpTokens: string;
  withdrawQueueHead: number;
  withdrawQueueTail: number;
  poolAddress: string;
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
  amount: string;
  vaultData?: EnhancedPoolData | null;
  liquidityPool?: PublicKey | null;
}

export interface UseWithdrawProps {
  amount: string;
  vaultData?: EnhancedPoolData | null;
  liquidityPool?: PublicKey | null;
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

export interface VaultActionTabsProps {
  vaultData?: VaultData | null;
  liquidityPool?: PublicKey | null;
  statistics?: {
    fees?: number;
    blpPrice?: number;
    totalSupply?: number;
  };
  userDepositData?: {
    totalDeposits: number;
  };
  userWithdrawalData?: {
    totalWithdrawals: number;
  };
  onVaultOperationSuccess?: () => void;
}

export interface EnhancedVaultDataPublic {
  poolData: EnhancedPoolData;
  apr: number;
  allocation: {
    totalValueLocked: number;
    allocationData: Array<{
      longExposure: number;
      shortExposure: number;
      longExposurePercentage: number;
      shortExposurePercentage: number;
      netExposure: number;
      isLong: boolean;
      logo?: string;
      name?: string;
    }>;
  };
  statistics: {
    fees: number;
    blpPrice: number;
    totalSupply: number;
  };
}

export interface EnhancedVaultDataUser extends EnhancedVaultDataPublic {
  userDepositData?: {
    totalDeposits: number;
  };
  userWithdrawalData?: {
    totalWithdrawals: number;
  };
  userWithdraw?: {
    totalWithdrawalsInQueue: number;
    totalWithdrawalsInCompleted: number;
    withdrawRequests: Array<{
      amount: number;
      status: string;
      requestedAt: string;
      userAddress: string;
    }>;
  };
}

export type EnhancedVaultData = EnhancedVaultDataPublic & Partial<EnhancedVaultDataUser>;

export interface VaultInfoProps {
  apr: number;
}

export interface TvlDisplayProps {
  totalValueLocked: number;
}

export interface ExposureTableProps {
  allocationData?: Array<{
    longExposure: number;
    shortExposure: number;
    longExposurePercentage: number;
    shortExposurePercentage: number;
    netExposure: number;
    isLong: boolean;
    logo?: string;
    name?: string;
  }>;
}

export interface WithdrawQueueProps {
  withdrawData?: {
    totalWithdrawalsInQueue: number;
    totalWithdrawalsInCompleted: number;
    withdrawRequests: Array<{
      amount: number;
      status: string;
      requestedAt: string;
      userAddress: string;
    }>;
  };
}
