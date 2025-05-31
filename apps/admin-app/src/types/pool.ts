import { ReactNode } from 'react';
import { PAGE_SIZE_OPTIONS } from '../constants/pool';

export interface PoolData {
  totalLiquidity: number;
  totalShares: number;
  depositFee: number;
  withdrawalFee: number;
  minDeposit: number;
  lastUpdate: number;
  lastUpdateTimestamp: number;
  bump: number;
  lpMint: string;
  tokenVault: string;
  depositFeeBps: number;
  withdrawalFeeBps: number;
}

export interface FormattedPoolData {
  totalLiquidity: string;
  totalShares: string;
  depositFee: string;
  withdrawalFee: string;
  minDeposit: string;
  lastUpdate: string;
  bump: number;
  lpMint: string;
  tokenVault: string;
}

export interface PoolInformationProps {
  poolData: FormattedPoolData;
}

export interface CopyFieldProps {
  value: string;
  label: string;
}

export interface FormData {
  depositFeeBps: string;
  withdrawalFeeBps: string;
  minDeposit: string;
}

export interface FormErrors {
  depositFeeBps?: string;
  withdrawalFeeBps?: string;
  minDeposit?: string;
}

export interface PoolInitializationFormProps {
  formData: FormData;
  formErrors: FormErrors;
  isLoading: boolean;
  onInputChange: (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}

export interface PoolDeposit {
  address: string;
  usdcDeposit: number;
  sharePercentage: string;
  lpTokens: number;
}

export interface PoolParticipantsProps {
  participants: PoolDeposit[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: (typeof PAGE_SIZE_OPTIONS)[number]) => void;
}

export interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: ReactNode;
  tooltip?: string;
  trend?: { value: number; isPositive: boolean };
}
export interface UsePoolDataReturn {
  isInitialized: boolean;
  poolData: FormattedPoolData | null;
  isRefetching: boolean;
  refetch: () => void;
}
