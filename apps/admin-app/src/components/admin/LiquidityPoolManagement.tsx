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
  TrendingUp,
  DollarSign,
  Percent,
  Coins,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import React from 'react';

const BPS_TO_PERCENT = 100;
const USDC_DECIMALS = 1_000_000;
const MIN_FEE_BPS = 0;
const MAX_FEE_BPS = 1000;
const MIN_DEPOSIT_AMOUNT = 100_000;

interface LiquidityPoolData {
  totalLiquidity: string;
  totalShares: string;
  depositFeeBps: number;
  withdrawalFeeBps: number;
  minDeposit: string;
  lastUpdateTimestamp: string;
  lpMint: string;
  tokenVault: string;
}

interface PoolParticipant {
  address: string;
  usdcDeposit: number;
  sharePercentage: number;
  lpTokens: number;
}

const mockParticipants: PoolParticipant[] = [
  {
    address: '6SoyijgsZ5nQdabjHnPYe9a9kgJWZ8yQZGFvtdHCi57W',
    usdcDeposit: 5000,
    sharePercentage: 25,
    lpTokens: 5000,
  },
  {
    address: '7KZaKob6HRFDEXhdc2wNRReteGPTgkPbDQ1i4W7qAiUT',
    usdcDeposit: 3000,
    sharePercentage: 15,
    lpTokens: 3000,
  },
  {
    address: '8LZaKob6HRFDEXhdc2wNRReteGPTgkPbDQ1i4W7qAiUT',
    usdcDeposit: 2000,
    sharePercentage: 10,
    lpTokens: 2000,
  },
];

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
    errors.minDeposit = `Minimum deposit must be at least ${
      MIN_DEPOSIT_AMOUNT / USDC_DECIMALS
    } USDC`;
  }

  return errors;
};

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon?: React.ReactNode;
  tooltip?: string;
  trend?: { value: number; isPositive: boolean };
}

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
          className={`flex items-center gap-1 text-sm ${
            trend.isPositive ? 'text-green-400' : 'text-red-400'
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

export function LiquidityPoolManagement() {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(() => {
    return localStorage.getItem('poolInitialized') === 'true';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [poolData, setPoolData] = useState<LiquidityPoolData | null>(() => {
    const savedData = localStorage.getItem('poolData');
    return savedData ? JSON.parse(savedData) : null;
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [participants, setParticipants] = useState<PoolParticipant[]>(mockParticipants); // eslint-disable-line

  const [formData, setFormData] = useState<FormData>({
    depositFeeBps: '10',
    withdrawalFeeBps: '30',
    minDeposit: '1000000',
  });

  const {
    data: liquidityPool,
    refetch,
    isLoading: isRefetching,
  } = trpc.pool.getLiquidityPool.useQuery(undefined, {
    retry: 3,
    retryDelay: 1000,
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to fetch pool data: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (liquidityPool?.success === true && 'data' in liquidityPool) {
      setIsInitialized(true);
      setPoolData(liquidityPool.data);
    } else {
      setIsInitialized(false);
      setPoolData(null);
    }
  }, [liquidityPool]);

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

    try {
      setIsLoading(true);

      // Create mock pool data
      const mockPoolData: LiquidityPoolData = {
        totalLiquidity: '10000',
        totalShares: '10000',
        depositFeeBps: Number(formData.depositFeeBps),
        withdrawalFeeBps: Number(formData.withdrawalFeeBps),
        minDeposit: formData.minDeposit,
        lastUpdateTimestamp: Date.now().toString(),
        lpMint: 'mockLpMintAddress',
        tokenVault: 'mockTokenVaultAddress',
      };

      // Save to localStorage
      localStorage.setItem('poolInitialized', 'true');
      localStorage.setItem('poolData', JSON.stringify(mockPoolData));

      setIsInitialized(true);
      setPoolData(mockPoolData);

      toast({
        title: 'Success',
        description: 'Liquidity pool initialized successfully',
      });
    } catch (error) {
      console.error('Error initializing liquidity pool:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to initialize liquidity pool',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, toast]);

  const formattedPoolData = useMemo(() => {
    if (!poolData) return null;
    return {
      totalLiquidity: `${Number(poolData.totalLiquidity) / USDC_DECIMALS} USDC`,
      totalShares: `${Number(poolData.totalShares) / USDC_DECIMALS} LP`,
      depositFee: `${Number(poolData.depositFeeBps) / BPS_TO_PERCENT}%`,
      withdrawalFee: `${Number(poolData.withdrawalFeeBps) / BPS_TO_PERCENT}%`,
      minDeposit: `${Number(poolData.minDeposit) / USDC_DECIMALS} USDC`,
      lastUpdate: new Date(Number(poolData.lastUpdateTimestamp) * 1000).toLocaleString(),
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
                      className={`bg-[#181c27] border-[#23263a] focus:border-primary rounded-xl ${
                        formErrors.depositFeeBps ? 'border-red-500' : ''
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
                      className={`bg-[#181c27] border-[#23263a] focus:border-primary rounded-xl ${
                        formErrors.withdrawalFeeBps ? 'border-red-500' : ''
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
                      className={`bg-[#181c27] border-[#23263a] focus:border-primary rounded-xl ${
                        formErrors.minDeposit ? 'border-red-500' : ''
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
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Liquidity"
                value={formattedPoolData?.totalLiquidity || '-'}
                subtext="Total value locked in the pool"
                icon={<DollarSign className="h-4 w-4" />}
                trend={{ value: 2.5, isPositive: true }}
              />
              <StatCard
                label="Total Shares"
                value={formattedPoolData?.totalShares || '-'}
                subtext="Total LP tokens issued"
                icon={<Percent className="h-4 w-4" />}
              />
              <StatCard
                label="Deposit Fee"
                value={formattedPoolData?.depositFee || '-'}
                subtext="Fee charged on deposits"
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <StatCard
                label="Withdrawal Fee"
                value={formattedPoolData?.withdrawalFee || '-'}
                subtext="Fee charged on withdrawals"
                icon={<TrendingUp className="h-4 w-4" />}
              />
            </div>

            {/* Pool Participants Table */}
            <Card className="bg-white/5 border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white">Pool Participants</CardTitle>
              </CardHeader>
              <CardContent>
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
                      {participants.map((participant, index) => (
                        <tr
                          key={participant.address}
                          className="border-b border-white/5 hover:bg-white/5"
                        >
                          <td className="py-3 px-4 text-white/80">{index + 1}</td>
                          <td className="py-3 px-4 text-white/80 font-mono text-sm">
                            {participant.address.slice(0, 4)}...{participant.address.slice(-4)}
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
              </CardContent>
            </Card>

            {/* Pool Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/5 border-white/10 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white">Pool Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Minimum Deposit</span>
                      <span className="text-white">{formattedPoolData?.minDeposit || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Last Update</span>
                      <span className="text-white">{formattedPoolData?.lastUpdate || '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white">Pool Addresses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-white/60 text-sm">LP Token Mint</span>
                      <span className="text-sm break-all font-mono bg-white/5 p-2 rounded">
                        {poolData?.lpMint || 'Loading...'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-white/60 text-sm">Token Vault</span>
                      <span className="text-sm break-all font-mono bg-white/5 p-2 rounded">
                        {poolData?.tokenVault || 'Loading...'}
                      </span>
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
