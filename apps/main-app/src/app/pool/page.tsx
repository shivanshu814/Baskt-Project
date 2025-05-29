'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Info,
  TrendingUp,
  DollarSign,
  Percent,
  Coins,
  Wallet,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import React from 'react';
import BN from 'bn.js';
import { useBasktClient } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';

interface PoolData {
  totalLiquidity: string;
  totalShares: string;
  depositFeeBps: number;
  withdrawalFeeBps: number;
  minDeposit: string;
  lastUpdateTimestamp: string;
  lpMint: string;
  tokenVault: string;
}

const MOCK_CONFIG = {
  pool: {
    totalLiquidity: '1000000000',
    totalShares: '1000000000',
    depositFeeBps: 50,
    withdrawalFeeBps: 50,
    minDeposit: '100000',
    lpMint: 'mock_lp_mint',
    tokenVault: 'mock_token_vault',
  },
  user: {
    usdcBalance: '500000000',
    lpBalance: '100000000',
  },
  market: {
    apy: 5.2,
    apyChange: 0.8,
    liquidityChange: 2.5,
  },
};

const AnimatedNumber = React.memo(({ value, className }: { value: string; className?: string }) => {
  const [display, setDisplay] = useState(value);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (display !== value) {
      setFade(true);
      const timer = setTimeout(() => {
        setDisplay(value);
        setFade(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [value, display]);

  return (
    <span
      className={`${className || ''} transition-opacity duration-300 ${
        fade ? 'opacity-40' : 'opacity-100'
      }`}
    >
      {display}
    </span>
  );
});
AnimatedNumber.displayName = 'AnimatedNumber';

const StatCard = React.memo(
  ({
    label,
    value,
    subtext,
    icon,
    tooltip,
    trend,
  }: {
    label: string;
    value: string;
    subtext?: string;
    icon?: React.ReactNode;
    tooltip?: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <div className="relative group rounded-xl p-4 bg-white/5 backdrop-blur-md border border-white/10 shadow-lg flex flex-col gap-1 hover:bg-white/10 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-white/70 font-medium">
          {icon}
          {label}
          {tooltip && (
            <span className="cursor-pointer">
              <Info className="h-4 w-4 text-white/40 group-hover:text-primary transition" />
            </span>
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
  ),
);
StatCard.displayName = 'StatCard';

const ActionCard = React.memo(
  ({
    title,
    description,
    icon,
    inputValue,
    setInputValue,
    onAction,
    actionLabel,
    loading,
    color,
    disabled,
    priceImpact,
    fee,
    maxAmount,
    onMaxClick,
    expectedOutput,
  }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    inputValue: string;
    setInputValue: (v: string) => void;
    onAction: () => void;
    actionLabel: string;
    loading: boolean;
    color: 'green' | 'red';
    disabled: boolean;
    priceImpact?: string;
    fee?: string;
    maxAmount?: string;
    onMaxClick?: () => void;
    expectedOutput?: string;
  }) => {
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
      },
      [setInputValue],
    );

    return (
      <Card className="shadow-xl border-0 bg-white/5 backdrop-blur-md rounded-2xl transition-shadow hover:shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Input
                type="number"
                min={0}
                step="any"
                placeholder={`Enter amount to ${actionLabel.toLowerCase()}`}
                value={inputValue}
                onChange={handleInputChange}
                className="pr-20 text-lg font-semibold bg-[#181c27] border border-[#23263a] focus:border-primary rounded-xl"
                disabled={loading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {maxAmount && (
                  <button
                    onClick={onMaxClick}
                    className="text-xs text-primary hover:text-primary/80 transition-colors bg-primary/10 px-2 py-1 rounded"
                  >
                    MAX
                  </button>
                )}
                <span className="text-white/60 font-medium">USDC</span>
              </div>
            </div>

            <div className="space-y-2 text-sm bg-white/5 p-3 rounded-lg">
              {expectedOutput && (
                <div className="flex justify-between text-white/80">
                  <span>You will receive:</span>
                  <span className="font-medium">{expectedOutput}</span>
                </div>
              )}
              {priceImpact && (
                <div className="flex justify-between text-white/80">
                  <span>Price Impact:</span>
                  <span className={Number(priceImpact) > 1 ? 'text-red-400' : 'text-green-400'}>
                    {priceImpact}
                  </span>
                </div>
              )}
              {fee && (
                <div className="flex justify-between text-white/80">
                  <span>Fee:</span>
                  <span className="font-medium">{fee}</span>
                </div>
              )}
            </div>

            <Button
              className={`w-full text-base font-bold py-3 rounded-xl shadow-md transition-all duration-200 ${
                color === 'green'
                  ? 'bg-green-500 hover:bg-green-600 focus:ring-green-700'
                  : 'bg-red-500 hover:bg-red-600 focus:ring-red-700'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              onClick={onAction}
              disabled={loading || disabled}
              aria-label={actionLabel}
            >
              {loading ? (
                <div className="flex items-center gap-2 justify-center animate-pulse">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {actionLabel}...
                </div>
              ) : (
                actionLabel
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  },
);
ActionCard.displayName = 'ActionCard';

export default function PoolPage() {
  const { authenticated } = usePrivy();
  const { client, wallet } = useBasktClient();
  const router = useRouter();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [userBalance, setUserBalance] = useState<BN | null>(null);
  const [liquidityPool, setLiquidityPool] = useState<PublicKey | null>(null);
  const [userLpBalance, setUserLpBalance] = useState<BN | null>(null);

  const isDepositValid = useMemo(
    () => depositAmount && !isNaN(Number(depositAmount)) && Number(depositAmount) > 0,
    [depositAmount],
  );

  const isWithdrawValid = useMemo(
    () => withdrawAmount && !isNaN(Number(withdrawAmount)) && Number(withdrawAmount) > 0,
    [withdrawAmount],
  );

  const fetchPoolData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!client) return;

      setPoolData({
        ...MOCK_CONFIG.pool,
        lastUpdateTimestamp: new Date().toISOString(),
      });
      setUserBalance(new BN(MOCK_CONFIG.user.usdcBalance));
      setUserLpBalance(new BN(MOCK_CONFIG.user.lpBalance));
      setLiquidityPool(new PublicKey('mock_pool_address'));
    } catch (error) {
      console.error('Error fetching pool data:', error);
      toast.error('Failed to fetch pool data');
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const fetchUserData = useCallback(async () => {
    if (!wallet?.address) return;
    try {
      setUserBalance(new BN(MOCK_CONFIG.user.usdcBalance));
    } catch (error) {
      console.error('Error fetching USDC account:', error);
      setUserBalance(new BN(0));
      toast.error('Failed to fetch USDC balance. Please try again.');
    }
  }, [wallet]);

  useEffect(() => {
    if (authenticated) {
      fetchPoolData();
      fetchUserData();
    }
  }, [authenticated, fetchPoolData, fetchUserData]);

  const calculateUserShare = useCallback(() => {
    if (!poolData || !userLpBalance) return '0%';
    const userShare = (Number(userLpBalance.toString()) / Number(poolData.totalShares)) * 100;
    return `${userShare.toFixed(2)}%`;
  }, [poolData, userLpBalance]);

  const calculatePriceImpact = useCallback(
    (amount: string) => {
      if (!poolData || !amount) return '0%';
      const depositAmount = Number(amount);
      const totalLiquidity = Number(poolData.totalLiquidity) / 1_000_000;
      const impact = (depositAmount / (totalLiquidity + depositAmount)) * 100;
      return `${impact.toFixed(2)}%`;
    },
    [poolData],
  );

  const calculateFee = useCallback(
    (amount: string) => {
      if (!poolData || !amount) return '0 USDC';
      const depositAmount = Number(amount);
      const fee = (depositAmount * poolData.depositFeeBps) / 10000;
      return `${fee.toFixed(2)} USDC`;
    },
    [poolData],
  );

  const calculateExpectedOutput = useCallback(
    (amount: string, isDeposit: boolean) => {
      if (!poolData || !amount) return '0 USDC';
      const depositAmount = Number(amount);
      const totalLiquidity = Number(poolData.totalLiquidity) / 1_000_000;
      const impact = (depositAmount / (totalLiquidity + depositAmount)) * 100;
      const expectedOutput = (depositAmount * (100 - impact)) / 100;
      return `${expectedOutput.toFixed(2)} ${isDeposit ? 'LP' : 'USDC'}`;
    },
    [poolData],
  );

  const handleDeposit = useCallback(async () => {
    if (!isDepositValid || !client || !wallet?.address || !liquidityPool || !poolData) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsDepositing(true);
    try {
      toast.success('Deposit successful');
      setDepositAmount('');
      fetchPoolData();
      fetchUserData();
    } catch (error) {
      console.error('Error depositing:', error);
      toast.error('Failed to deposit');
    } finally {
      setIsDepositing(false);
    }
  }, [
    isDepositValid,
    client,
    wallet,
    liquidityPool,
    poolData,
    depositAmount,
    fetchPoolData,
    fetchUserData,
  ]);

  const handleWithdraw = useCallback(async () => {
    if (!isWithdrawValid || !client || !wallet?.address || !liquidityPool || !poolData) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsWithdrawing(true);
    try {
      toast.success('Withdrawal successful');
      setWithdrawAmount('');
      fetchPoolData();
      fetchUserData();
    } catch (error) {
      console.error('Error withdrawing:', error);
      toast.error('Failed to withdraw');
    } finally {
      setIsWithdrawing(false);
    }
  }, [
    isWithdrawValid,
    client,
    wallet,
    liquidityPool,
    poolData,
    withdrawAmount,
    fetchPoolData,
    fetchUserData,
  ]);

  if (!authenticated) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-[#010b1d]/80 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1">
              <div className="bg-[#181c27] rounded-full p-2 flex items-center justify-center">
                <Coins className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Liquidity Pool</h1>
              <p className="text-white/60 text-sm mt-1">Deposit USDC to earn trading fees</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPoolData}
            className="flex items-center gap-2 border border-white/10 bg-white/10 text-white hover:bg-white/20"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Liquidity"
            value={`$${(Number(poolData?.totalLiquidity || 0) / 1_000_000).toLocaleString()}`}
            subtext="Total value locked in the pool"
            icon={<DollarSign className="h-4 w-4" />}
            trend={{ value: MOCK_CONFIG.market.liquidityChange, isPositive: true }}
          />
          <StatCard
            label="Your Share"
            value={calculateUserShare()}
            subtext="Your ownership percentage"
            icon={<Percent className="h-4 w-4" />}
          />
          <StatCard
            label="APY"
            value={`${MOCK_CONFIG.market.apy}%`}
            subtext="Current annual yield"
            icon={<TrendingUp className="h-4 w-4" />}
            trend={{ value: MOCK_CONFIG.market.apyChange, isPositive: true }}
          />
          <StatCard
            label="Your Balance"
            value={`${userBalance ? Number(userBalance.toString()) / 1_000_000 : 0} USDC`}
            subtext="Available for deposit"
            icon={<Wallet className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">Pool Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Deposit Fee</span>
                  <span className="text-white">
                    {poolData ? `${poolData.depositFeeBps / 100}%` : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Withdrawal Fee</span>
                  <span className="text-white">
                    {poolData ? `${poolData.withdrawalFeeBps / 100}%` : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Minimum Deposit</span>
                  <span className="text-white">
                    {poolData ? `${Number(poolData.minDeposit) / 1_000_000} USDC` : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Total Shares</span>
                  <span className="text-white">
                    {poolData ? `${Number(poolData.totalShares) / 1_000_000} LP` : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <ActionCard
              title="Deposit"
              description="Add liquidity to the pool"
              icon={<ArrowUpRight className="h-5 w-5 text-green-400" />}
              inputValue={depositAmount}
              setInputValue={setDepositAmount}
              onAction={handleDeposit}
              actionLabel="Deposit"
              loading={isDepositing}
              color="green"
              disabled={!isDepositValid}
              priceImpact={calculatePriceImpact(depositAmount)}
              fee={calculateFee(depositAmount)}
              maxAmount={
                userBalance ? (Number(userBalance.toString()) / 1_000_000).toString() : undefined
              }
              onMaxClick={() =>
                setDepositAmount(
                  userBalance ? (Number(userBalance.toString()) / 1_000_000).toString() : '',
                )
              }
              expectedOutput={calculateExpectedOutput(depositAmount, true)}
            />
            <ActionCard
              title="Withdraw"
              description="Remove liquidity from the pool"
              icon={<ArrowDownRight className="h-5 w-5 text-red-400" />}
              inputValue={withdrawAmount}
              setInputValue={setWithdrawAmount}
              onAction={handleWithdraw}
              actionLabel="Withdraw"
              loading={isWithdrawing}
              color="red"
              disabled={!isWithdrawValid}
              priceImpact={calculatePriceImpact(withdrawAmount)}
              fee={calculateFee(withdrawAmount)}
              expectedOutput={calculateExpectedOutput(withdrawAmount, false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
