import { useEffect, useMemo, useState, useCallback } from 'react';
import { useToast } from '../use-toast';
import { trpc } from '../../utils/trpc';
import { useBasktClient, USDC_MINT } from '@baskt/ui';
import { Keypair } from '@solana/web3.js';
import BN from 'bn.js';
import { usePrivy } from '@privy-io/react-auth';
import {
  REFRESH_INTERVAL,
  BPS_TO_PERCENT,
  USDC_DECIMALS,
  MIN_FEE_BPS,
  MAX_FEE_BPS,
  MIN_DEPOSIT_AMOUNT,
  PAGE_SIZE_OPTIONS,
} from '../../constants/pool';
import type {
  UsePoolDataReturn,
  PoolData,
  FormData,
  FormErrors,
  PoolDeposit,
} from '../../types/pool';
import { formatPoolData } from '../../utils/pool';

export const validateFormData = (data: FormData): FormErrors => {
  const errors: FormErrors = {};

  const depositFee = Number(data.depositFeeBps);
  if (isNaN(depositFee) || depositFee < MIN_FEE_BPS || depositFee > MAX_FEE_BPS) {
    errors.depositFeeBps = `Fee must be between ${MIN_FEE_BPS} and ${MAX_FEE_BPS} basis points`;
  }

  const withdrawalFee = Number(data.withdrawalFeeBps);
  if (isNaN(withdrawalFee) || withdrawalFee < MIN_FEE_BPS || withdrawalFee > MAX_FEE_BPS) {
    errors.withdrawalFeeBps = `Fee must be between ${MIN_FEE_BPS} and ${MAX_FEE_BPS} basis points`;
  }

  const minDeposit = Number(data.minDeposit);
  if (isNaN(minDeposit) || minDeposit < MIN_DEPOSIT_AMOUNT) {
    errors.minDeposit = `Minimum deposit must be at least ${
      MIN_DEPOSIT_AMOUNT / USDC_DECIMALS
    } USDC`;
  }

  return errors;
};

interface UsePoolProps {
  initialFormValues?: Partial<FormData>;
  onInitializationSuccess?: () => void;
}

interface UsePoolReturn extends UsePoolDataReturn {
  // Form related
  formData: FormData;
  formErrors: FormErrors;
  handleInputChange: (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  validateForm: () => FormErrors;
  isLoading: boolean;
  initializePool: (formData: FormData) => Promise<void>;

  // Pagination related
  paginatedParticipants: PoolDeposit[];
  totalPages: number;
  currentPage: number;
  pageSize: number;
  handlePageChange: (newPage: number) => void;
  handlePageSizeChange: (size: (typeof PAGE_SIZE_OPTIONS)[number]) => void;
}

export function usePool({
  initialFormValues,
  onInitializationSuccess,
}: UsePoolProps = {}): UsePoolReturn {
  const { toast } = useToast();
  const { client } = useBasktClient();
  const { user } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    depositFeeBps: initialFormValues?.depositFeeBps || '10',
    withdrawalFeeBps: initialFormValues?.withdrawalFeeBps || '30',
    minDeposit: initialFormValues?.minDeposit || '1000000',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(
    PAGE_SIZE_OPTIONS[0],
  );

  // Pool data
  const {
    data: liquidityPool,
    refetch,
    isLoading: isRefetching,
  } = trpc.pool.getLiquidityPool.useQuery();

  const { data: depositsData } = trpc.pool.getPoolDeposits.useQuery();

  useEffect(() => {
    if (liquidityPool && 'error' in liquidityPool && liquidityPool.error) {
      toast({
        title: 'Error',
        description: `Failed to fetch pool data: ${liquidityPool.error}`,
        variant: 'destructive',
      });
    }
  }, [liquidityPool, toast]);

  const isInitialized = liquidityPool?.success === true && 'data' in liquidityPool;

  const poolData = useMemo(() => {
    if (!liquidityPool || !isInitialized) return null;

    const rawData: PoolData = {
      totalLiquidity: Number(liquidityPool.data.totalLiquidity) / USDC_DECIMALS,
      totalShares: Number(liquidityPool.data.totalShares) / USDC_DECIMALS,
      depositFee: Number(liquidityPool.data.depositFeeBps) / BPS_TO_PERCENT,
      withdrawalFee: Number(liquidityPool.data.withdrawalFeeBps) / BPS_TO_PERCENT,
      minDeposit: Number(liquidityPool.data.minDeposit) / USDC_DECIMALS,
      lastUpdate: Number(liquidityPool.data.lastUpdateTimestamp),
      lastUpdateTimestamp: Number(liquidityPool.data.lastUpdateTimestamp),
      bump: liquidityPool.data.bump,
      lpMint: liquidityPool.data.lpMint,
      tokenVault: liquidityPool.data.tokenVault,
      depositFeeBps: Number(liquidityPool.data.depositFeeBps),
      withdrawalFeeBps: Number(liquidityPool.data.withdrawalFeeBps),
    };

    return formatPoolData(rawData);
  }, [liquidityPool, isInitialized]);

  // Form handlers
  const handleInputChange = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [],
  );

  const validateForm = useCallback(() => {
    const errors = validateFormData(formData);
    setFormErrors(errors);
    return errors;
  }, [formData]);

  // Pool initialization
  const initializePool = useCallback(
    async (formData: FormData) => {
      if (!client || !user?.wallet) {
        toast({
          title: 'Error',
          description: 'Baskt client or wallet not initialized',
          variant: 'destructive',
        });
        return;
      }

      try {
        setIsLoading(true);

        const depositFeeBps = Number(formData.depositFeeBps);
        const withdrawalFeeBps = Number(formData.withdrawalFeeBps);
        const minDeposit = new BN(formData.minDeposit);

        const lpMintKeypair = Keypair.generate();
        const lpMint = lpMintKeypair.publicKey;

        await client.initializeLiquidityPool(
          depositFeeBps,
          withdrawalFeeBps,
          minDeposit,
          lpMint,
          USDC_MINT,
          lpMintKeypair,
        );

        toast({
          title: 'Success',
          description: 'Liquidity pool initialized successfully',
        });

        onInitializationSuccess?.();
      } catch (error: unknown) {
        toast({
          title: 'Error',
          description:
            error instanceof Error ? error.message : 'Failed to initialize liquidity pool',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [client, user, toast, onInitializationSuccess],
  );

  // Pagination
  const deposits = useMemo(() => {
    if (
      !depositsData ||
      !('success' in depositsData) ||
      !depositsData.success ||
      !('data' in depositsData) ||
      !Array.isArray(depositsData.data)
    )
      return [];
    return depositsData.data;
  }, [depositsData]);

  const paginatedParticipants = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return deposits.slice(startIndex, endIndex);
  }, [deposits, currentPage, pageSize]);

  const totalPages = useMemo(
    () => Math.ceil(deposits.length / pageSize),
    [deposits.length, pageSize],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
      }
    },
    [totalPages],
  );

  const handlePageSizeChange = useCallback((size: (typeof PAGE_SIZE_OPTIONS)[number]) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  useEffect(() => {
    if (isInitialized) {
      const interval = setInterval(refetch, REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isInitialized, refetch]);

  return {
    // Pool data
    isInitialized,
    poolData,
    isRefetching,
    refetch,

    // Form related
    formData,
    formErrors,
    handleInputChange,
    validateForm,
    isLoading,
    initializePool,

    // Pagination related
    paginatedParticipants,
    totalPages,
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
  };
}
