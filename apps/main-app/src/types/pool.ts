import { ReactNode } from 'react';
import { PublicKey } from '@solana/web3.js';

export interface PoolData {
  totalLiquidity: string;
  totalShares: string;
  depositFeeBps: number;
  withdrawalFeeBps: number;
  minDeposit: string;
  lastUpdateTimestamp: string;
  lpMint: string;
  tokenVault: string;
}

export type PoolResponse =
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
      };
    }
  | {
      success: false;
      error: string;
    };

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
}

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

export interface LiquidityAllocationProps {
  tvl: string;
  allocations: TokenAllocation[];
  blpPrice: string;
  totalSupply: string;
}

export interface PoolDepositProps {
  depositAmount: string;
  setDepositAmount: (amount: string) => void;
  isDepositing: boolean;
  isDepositValid: boolean;
  handleDeposit: () => Promise<void>;
  usdcBalance: string;
  calculateFee: (amount: string, isDeposit: boolean) => string;
  calculateExpectedOutput: (amount: string, isDeposit: boolean) => string;
}

export interface PoolInfoProps {
  apy: string;
  lastUpdated: string;
}

export interface PoolWithdrawProps {
  withdrawAmount: string;
  setWithdrawAmount: (amount: string) => void;
  isWithdrawing: boolean;
  isWithdrawValid: boolean;
  handleWithdraw: () => Promise<void>;
  lpBalance: string;
  calculateFee: (amount: string, isDeposit: boolean) => string;
  calculateExpectedOutput: (amount: string, isDeposit: boolean) => string;
}

export interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: ReactNode;
  tooltip?: string;
  trend?: { value: number; isPositive: boolean };
}

export interface UseDepositProps {
  poolData: PoolData | null;
  liquidityPool: PublicKey | null;
  onSuccess?: () => void;
}

export interface UsePoolCalculationsProps {
  poolData: PoolData | null;
}

export interface UseUserBalancesProps {
  poolData: {
    lpMint: string;
  } | null;
}

export interface UseWithdrawProps {
  poolData: PoolData | null;
  liquidityPool: PublicKey | null;
  onSuccess?: () => void;
}
