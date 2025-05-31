import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import { trpc } from '../../utils/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import {
  AlertCircle,
  RefreshCw,
  Info,
  Coins,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import React from 'react';
import { useBasktClient, USDC_MINT } from '@baskt/ui';
import { Keypair } from '@solana/web3.js';
import BN from 'bn.js';
import { usePrivy } from '@privy-io/react-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const BPS_TO_PERCENT = 100;
const USDC_DECIMALS = 1_000_000;
const MIN_FEE_BPS = 0;
const MAX_FEE_BPS = 1000;
const MIN_DEPOSIT_AMOUNT = 100_000;
const REFRESH_INTERVAL = 10000;

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];



type PoolDeposit = {
  address: string;
  usdcDeposit: number;
  sharePercentage: string;
  lpTokens: number;
};

interface FormData {
  depositFeeBps: string;
  withdrawalFeeBps: string;
  minDeposit: string;
}

interface FormErrors {
  depositFeeBps?: string;
  withdrawalFeeBps?: string;
  minDeposit?: string;
}

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
  tooltip?: string;
  trend?: { value: number; isPositive: boolean };
}



const usePoolData = () => {
  const { toast } = useToast();

  const {
    data: liquidityPool,
    refetch,
    isLoading: isRefetching,
  } = trpc.pool.getLiquidityPool.useQuery();

  useEffect(() => {
    if (liquidityPool && 'error' in liquidityPool && liquidityPool.error) {
      toast({
        title: 'Error',
        description: `Failed to fetch pool data: ${liquidityPool.error}`,
        variant: 'destructive',
      });
    }
  }, [liquidityPool, toast]);

  // Determine initialization and pool data from TRPC result
  const isInitialized = liquidityPool?.success === true && 'data' in liquidityPool;
  const poolData = isInitialized ? liquidityPool.data : null;

  useEffect(() => {
    if (isInitialized) {
      const interval = setInterval(refetch, REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isInitialized, refetch]);

  return {
    isInitialized,
    poolData,
    isRefetching,
    refetch,
  };
};

const validateFormData = (data: FormData): FormErrors => {
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
    errors.minDeposit = `Minimum deposit must be at least ${MIN_DEPOSIT_AMOUNT / USDC_DECIMALS
      } USDC`;
  }

  return errors;
};

const StatCard = React.memo(({ label, value, subtext, icon, tooltip, trend }: StatCardProps) => (
  <div className="relative group rounded-xl p-4 bg-white/5 backdrop-blur-md border border-white/10 shadow-lg flex flex-col gap-1 hover:bg-white/10 transition-all duration-200">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-white/70 font-medium">
        {icon}
        {label}
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-white/40 group-hover:text-primary transition" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'
            }`}
        >
          {trend.isPositive ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {trend.value}%
        </div>
      )}
    </div>
    <div className="mt-1">
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtext && <div className="text-sm text-white/60 mt-1">{subtext}</div>}
    </div>
  </div>
));

StatCard.displayName = 'StatCard';

const CopyField = React.memo(({ value, label }: { value: string; label: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [value]);

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
        {label}
        <button
          onClick={handleCopy}
          className="ml-1 p-1 rounded hover:bg-white/10 transition"
          title="Copy"
          type="button"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4 text-white/40" />
          )}
        </button>
      </div>
      <div className="flex items-center bg-white/10 rounded px-3 py-2 font-mono text-white text-sm break-all shadow-inner">
        {value}
      </div>
    </div>
  );
});

CopyField.displayName = 'CopyField';

export function LiquidityPoolManagement() {
  const { toast } = useToast();
  const { client } = useBasktClient();
  const { user } = usePrivy();
  const { isInitialized, poolData, isRefetching, refetch } = usePoolData();
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(25);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const { data: depositsData } = trpc.pool.getPoolDeposits.useQuery();

  const [formData, setFormData] = useState<FormData>({
    depositFeeBps: '10',
    withdrawalFeeBps: '30',
    minDeposit: '1000000',
  });

  const paginatedParticipants = useMemo(() => {
    if (
      !depositsData ||
      !('success' in depositsData) ||
      !depositsData.success ||
      !('data' in depositsData) ||
      !Array.isArray(depositsData.data)
    )
      return [];
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return depositsData.data.slice(startIndex, endIndex);
  }, [depositsData, currentPage, pageSize]);

  const totalPages = useMemo(
    () =>
      Math.ceil(
        (depositsData &&
          'success' in depositsData &&
          depositsData.success &&
          'data' in depositsData &&
          Array.isArray(depositsData.data)
          ? depositsData.data.length
          : 0) / pageSize,
      ),
    [depositsData, pageSize],
  );

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((value: string) => {
    setPageSize(Number(value) as PageSize);
    setCurrentPage(1);
  }, []);

  const handleInputChange = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [],
  );

  const handleInitialize = useCallback(async () => {
    const errors = validateFormData(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast({
        title: 'Validation Error',
        description: 'Please check the form for errors',
        variant: 'destructive',
      });
      return;
    }

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
    } catch (error: unknown) {
      console.error('Error initializing liquidity pool:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to initialize liquidity pool',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, toast, client, user]);

  const formattedPoolData = useMemo(() => {
    if (!poolData) return null;

    const lastUpdateNum = Number(poolData.lastUpdateTimestamp);
    const formatDate = (timestamp: number) => {
      const date = new Date(timestamp * 1000);
      return date.toISOString().split('T')[0];
    };

    return {
      totalLiquidity: `${Number(poolData.totalLiquidity) / USDC_DECIMALS} USDC`,
      totalShares: `${Number(poolData.totalShares) / USDC_DECIMALS} LP`,
      depositFee: `${Number(poolData.depositFeeBps) / BPS_TO_PERCENT}%`,
      withdrawalFee: `${Number(poolData.withdrawalFeeBps) / BPS_TO_PERCENT}%`,
      minDeposit: `${Number(poolData.minDeposit) / USDC_DECIMALS} USDC`,
      lastUpdate: lastUpdateNum > 0 ? formatDate(lastUpdateNum) : '-',
      bump: poolData.bump,
    };
  }, [poolData]);

  if (isRefetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center px-4 py-4">
      <div className="w-full flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1">
              <div className="bg-[#181c27] rounded-full p-2 flex items-center justify-center">
                <Coins className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Baskt Liquidity Pool</h1>
              <p className="text-white/60 text-sm mt-1">Configure and monitor the liquidity pool</p>
            </div>
          </div>
          {isInitialized && (
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="flex items-center gap-2 border border-white/10 bg-white/10 text-white hover:bg-white/20"
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>

        {!isInitialized ? (
          <Card className="bg-white/5 border-white/10 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">
                Initialize Liquidity Pool
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Alert className="bg-yellow-500/10 border-yellow-500/20">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertTitle className="text-yellow-500">Attention Required</AlertTitle>
                  <AlertDescription className="text-yellow-500/80">
                    The liquidity pool needs to be initialized before users can start trading.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="depositFee" className="text-white/80">
                      Deposit Fee (Basis Points)
                    </Label>
                    <Input
                      id="depositFee"
                      type="number"
                      value={formData.depositFeeBps}
                      onChange={handleInputChange('depositFeeBps')}
                      placeholder="e.g., 10 for 0.1%"
                      className={`bg-[#181c27] border-[#23263a] focus:border-primary rounded-xl ${formErrors.depositFeeBps ? 'border-red-500' : ''
                        }`}
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">
                        Current value:{' '}
                        {(Number(formData.depositFeeBps) / BPS_TO_PERCENT).toFixed(2)}%
                      </span>
                      {formErrors.depositFeeBps && (
                        <span className="text-red-500">{formErrors.depositFeeBps}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="withdrawalFee" className="text-white/80">
                      Withdrawal Fee (Basis Points)
                    </Label>
                    <Input
                      id="withdrawalFee"
                      type="number"
                      value={formData.withdrawalFeeBps}
                      onChange={handleInputChange('withdrawalFeeBps')}
                      placeholder="e.g., 30 for 0.3%"
                      className={`bg-[#181c27] border-[#23263a] focus:border-primary rounded-xl ${formErrors.withdrawalFeeBps ? 'border-red-500' : ''
                        }`}
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">
                        Current value:{' '}
                        {(Number(formData.withdrawalFeeBps) / BPS_TO_PERCENT).toFixed(2)}%
                      </span>
                      {formErrors.withdrawalFeeBps && (
                        <span className="text-red-500">{formErrors.withdrawalFeeBps}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minDeposit" className="text-white/80">
                      Minimum Deposit Amount
                    </Label>
                    <Input
                      id="minDeposit"
                      type="number"
                      value={formData.minDeposit}
                      onChange={handleInputChange('minDeposit')}
                      placeholder="e.g., 1000000 for 1 USDC"
                      className={`bg-[#181c27] border-[#23263a] focus:border-primary rounded-xl ${formErrors.minDeposit ? 'border-red-500' : ''
                        }`}
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">
                        Current value: {Number(formData.minDeposit) / USDC_DECIMALS} USDC
                      </span>
                      {formErrors.minDeposit && (
                        <span className="text-red-500">{formErrors.minDeposit}</span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleInitialize}
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl shadow-md transition-all duration-200"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2 justify-center animate-pulse">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Initializing...
                      </div>
                    ) : (
                      'Initialize Liquidity Pool'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8">
              <Card className="bg-white/5 border-white/10 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white">Pool Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-white/60 text-sm">Total Liquidity</div>
                        <div className="text-lg font-semibold text-primary">
                          {formattedPoolData?.totalLiquidity || '-'}
                        </div>
                        <div className="text-xs text-white/40">
                          Total amount of liquidity in the pool
                        </div>
                      </div>
                      <div>
                        <div className="text-white/60 text-sm">Total Shares</div>
                        <div className="text-lg font-semibold text-primary">
                          {formattedPoolData?.totalShares || '-'}
                        </div>
                        <div className="text-xs text-white/40">Total supply of LP tokens</div>
                      </div>
                    </div>
                    <hr className="border-white/10" />

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-white/60 text-sm">Deposit Fee</div>
                        <div className="text-lg font-semibold text-primary">
                          {formattedPoolData?.depositFee || '-'}
                        </div>
                        <div className="text-xs text-white/40">Fee on deposits (bps)</div>
                      </div>
                      <div>
                        <div className="text-white/60 text-sm">Withdrawal Fee</div>
                        <div className="text-lg font-semibold text-primary">
                          {formattedPoolData?.withdrawalFee || '-'}
                        </div>
                        <div className="text-xs text-white/40">Fee on withdrawals (bps)</div>
                      </div>
                    </div>
                    <hr className="border-white/10" />

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-white/60 text-sm">Minimum Deposit</div>
                        <div className="text-lg font-semibold text-primary">
                          {formattedPoolData?.minDeposit || '-'}
                        </div>
                        <div className="text-xs text-white/40">Minimum deposit allowed</div>
                      </div>
                      <div>
                        <div className="text-white/60 text-sm">Last Update</div>
                        <div className="text-lg font-semibold text-primary">
                          {formattedPoolData?.lastUpdate &&
                            formattedPoolData.lastUpdate !== 'Invalid Date'
                            ? formattedPoolData.lastUpdate
                            : '-'}
                        </div>
                        <div className="text-xs text-white/40">Last pool update</div>
                      </div>
                    </div>
                    <hr className="border-white/10" />

                    <CopyField value={poolData?.lpMint || 'Loading...'} label="LP Token Mint" />
                    <div className="text-xs text-white/40 mb-2">
                      The token mint for the LP tokens
                    </div>
                    <CopyField value={poolData?.tokenVault || 'Loading...'} label="Token Vault" />
                    <div className="text-xs text-white/40">
                      The token account where collateral is stored
                    </div>
                    <hr className="border-white/10" />

                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Bump</span>
                        <span className="text-lg font-semibold text-primary">
                          {formattedPoolData?.bump || '-'}
                        </span>
                      </div>
                      <div className="text-xs text-white/40">Bump for this PDA</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white">Pool Participants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/60">Rows per page</span>
                        <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                          <SelectTrigger className="w-[100px] bg-white/5 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAGE_SIZE_OPTIONS.map((size) => (
                              <SelectItem key={size} value={size.toString()}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="text-sm text-white/60">
                        Page {currentPage} of {totalPages}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-4 text-white/60">S.No</th>
                            <th className="text-left py-3 px-4 text-white/60">Address</th>
                            <th className="text-left py-3 px-4 text-white/60">USDC Deposit</th>
                            <th className="text-left py-3 px-4 text-white/60">Share %</th>
                            <th className="text-left py-3 px-4 text-white/60">LP Tokens</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedParticipants.map((participant: PoolDeposit, index: number) => (
                            <tr
                              key={participant.address}
                              className="border-b border-white/5 hover:bg-white/5"
                            >
                              <td className="py-3 px-4 text-white/80">
                                {(currentPage - 1) * pageSize + index + 1}
                              </td>
                              <td className="py-3 px-4 text-white/80 font-mono text-sm">
                                <div className="flex items-center gap-2">
                                  <span>
                                    {participant.address.slice(0, 4)}...
                                    {participant.address.slice(-4)}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(participant.address);
                                      setCopiedAddress(participant.address);
                                      setTimeout(() => setCopiedAddress(null), 1200);
                                    }}
                                    className="p-1 rounded hover:bg-white/10 transition"
                                    title="Copy address"
                                    type="button"
                                  >
                                    {copiedAddress === participant.address ? (
                                      <Check className="h-4 w-4 text-green-400" />
                                    ) : (
                                      <Copy className="h-4 w-4 text-white/40" />
                                    )}
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-white/80">
                                ${participant.usdcDeposit.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-white/80">
                                {participant.sharePercentage}%
                              </td>
                              <td className="py-3 px-4 text-white/80">
                                {participant.lpTokens.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div className="text-sm text-white/60">
                        Showing {(currentPage - 1) * pageSize + 1} to{' '}
                        {Math.min(
                          currentPage * pageSize,
                          depositsData &&
                            'success' in depositsData &&
                            depositsData.success &&
                            'data' in depositsData &&
                            Array.isArray(depositsData.data)
                            ? depositsData.data.length
                            : 0,
                        )}{' '}
                        of{' '}
                        {depositsData &&
                          'success' in depositsData &&
                          depositsData.success &&
                          'data' in depositsData &&
                          Array.isArray(depositsData.data)
                          ? depositsData.data.length
                          : 0}{' '}
                        entries
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
