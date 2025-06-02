'use client';

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
import { useUSDCBalance } from "../../hooks/useUSDCBalance";
import { useTokenBalance } from "../../hooks/useTokenBalance";
import { ArrowUpRight, ArrowDownRight, Info, ChevronDown, ChevronUp } from 'lucide-react';
import React from 'react';
import BN from 'bn.js';
import { useBasktClient, USDC_MINT } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { trpc } from '../../utils/trpc';
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { Transaction } from '@solana/web3.js';
import { AccessControlRole } from '@baskt/types';
import { useToast } from '../../components/ui/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';

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

type PoolResponse =
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
      className={`${className || ''} transition-opacity duration-300 ${fade ? 'opacity-40' : 'opacity-100'
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
    fee,
    onMaxClick,
    expectedOutput,
    unit,
    tokenBalance,
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
    fee?: string;
    onMaxClick?: () => void;
    expectedOutput?: string;
    unit: string;
    tokenBalance: string;
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
                inputMode="decimal"
                step="0.01"
                min={0}
                placeholder={`Enter amount to ${actionLabel.toLowerCase()}`}
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={(e) => {
                  if (!/[0-9.]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                className="pr-20 text-lg font-semibold bg-[#181c27] border border-[#23263a] focus:border-primary rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                disabled={loading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={onMaxClick}
                  className="text-xs text-primary hover:text-primary/80 transition-colors bg-primary/10 px-2 py-1 rounded"
                  type="button"
                >
                  MAX
                </button>
                <span className="text-white/60 font-medium">{unit || 'USDC'}</span>
              </div>
            </div>
            {tokenBalance && (
              <div className="text-xs text-white/60 mt-1">
                Your {unit}: {tokenBalance}
              </div>
            )}
            <div className="space-y-2 text-sm bg-white/5 p-3 rounded-lg">
              {expectedOutput && (
                <div className="flex justify-between text-white/80">
                  <span>You will receive:</span>
                  <span className="font-medium">{expectedOutput}</span>
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
              className={`w-full text-base font-bold py-3 rounded-xl shadow-md transition-all duration-200 ${color === 'green'
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
  const { client, wallet } = useBasktClient();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(false); //eslint-disable-line
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [liquidityPool, setLiquidityPool] = useState<PublicKey | null>(null);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');

  const { balance: userUSDCBalance } = useUSDCBalance();
  const { balance: userLpBalance } = useTokenBalance(poolData?.lpMint ?? '', wallet?.address ?? '');

  const { data: poolDataResponse } = trpc.pool.getLiquidityPool.useQuery<PoolResponse>();

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
      const liquidityPoolPDA = await client.findLiquidityPoolPDA();

      setLiquidityPool(liquidityPoolPDA);
    } catch (error) {
      toast({
        title: 'Failed to fetch pool data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [client, wallet?.address, poolDataResponse]);

  useEffect(() => {
    if (poolDataResponse?.success) {
      setPoolData({
        totalLiquidity: poolDataResponse.data.totalLiquidity,
        totalShares: poolDataResponse.data.totalShares,
        depositFeeBps: poolDataResponse.data.depositFeeBps,
        withdrawalFeeBps: poolDataResponse.data.withdrawalFeeBps,
        minDeposit: poolDataResponse.data.minDeposit,
        lastUpdateTimestamp: new Date(poolDataResponse.data.lastUpdateTimestamp).toISOString(),
        lpMint: poolDataResponse.data.lpMint,
        tokenVault: poolDataResponse.data.tokenVault,
      });
    }
  }, [poolDataResponse]);

  useEffect(() => {
    fetchPoolData();
  }, [fetchPoolData]);

  // --- Utility Functions ---
const getFeeInUSDC = (amount: string, bps: number) => {
  const amt = Number(amount);
  if (!amount || isNaN(amt) || !bps) return '0.00 USDC';
  const fee = (amt * bps) / 10000;
  return `${fee.toFixed(2)} USDC`;
};

const getDepositOutputBLP = (amount: string, poolData: PoolData | null) => {
  if (!poolData || !amount) return '0.00 BLP';
  const amt = Number(amount);
  const totalLiquidity = Number(poolData.totalLiquidity) / 1_000_000;
  if (isNaN(amt) || totalLiquidity <= 0) return '0.00 BLP';
  // Simplified: 1:1 for demo, real logic should use pool share math
  return `${amt.toFixed(2)} BLP`;
};

const getWithdrawOutputUSDC = (amount: string, poolData: PoolData | null) => {
  if (!poolData || !amount) return '0.00 USDC';
  const amt = Number(amount);
  const totalShares = Number(poolData.totalShares) / 1_000_000;
  const totalLiquidity = Number(poolData.totalLiquidity) / 1_000_000;
  if (isNaN(amt) || totalShares <= 0) return '0.00 USDC';
  const usdcOut = (amt / totalShares) * totalLiquidity;
  return `${usdcOut.toFixed(2)} USDC`;
};

// --- Inside PoolPage ---
const calculateFee = useCallback(
  (amount: string, isDeposit: boolean) => {
    if (!poolData) return '0.00 USDC';
    return isDeposit
      ? getFeeInUSDC(amount, poolData.depositFeeBps)
      : getFeeInUSDC(getWithdrawOutputUSDC(amount, poolData).split(' ')[0], poolData.withdrawalFeeBps);
  },
  [poolData],
);

const calculateExpectedOutput = useCallback(
  (amount: string, isDeposit: boolean) => {
    if (!poolData) return isDeposit ? '0.00 BLP' : '0.00 USDC';
    return isDeposit
      ? getDepositOutputBLP(amount, poolData)
      : getWithdrawOutputUSDC(amount, poolData);
  },
  [poolData],
);


  const handleDeposit = useCallback(async () => {
    if (!isDepositValid || !client || !wallet?.address || !liquidityPool || !poolData) {
      return;
    }

    try {
      setIsDepositing(true);

      const depositAmountNum = Number(depositAmount);
      if (isNaN(depositAmountNum)) {
        toast({
          title: 'Invalid deposit amount',
          variant: 'destructive',
        });
        setIsDepositing(false);
        return;
      }
      const depositAmountBN = new BN(depositAmountNum * 1e6);
      const userTokenAccount = await client.getUserTokenAccount(
        new PublicKey(wallet.address),
        USDC_MINT,
      );

      let userLpAccount;
      try {
        userLpAccount = await client.getUserTokenAccount(
          new PublicKey(wallet.address),
          new PublicKey(poolData.lpMint),
        );
      } catch (error) {
        try {
          const createAtaIx = createAssociatedTokenAccountInstruction(
            new PublicKey(wallet.address),
            getAssociatedTokenAddressSync(
              new PublicKey(poolData.lpMint),
              new PublicKey(wallet.address),
            ),
            new PublicKey(wallet.address),
            new PublicKey(poolData.lpMint),
          );

          const tx = new Transaction().add(createAtaIx);
          await client.provider.sendAndConfirmLegacy(tx);

          userLpAccount = await client.getUserTokenAccount(
            new PublicKey(wallet.address),
            new PublicKey(poolData.lpMint),
          );
        } catch (createError) {
          toast({
            title: 'Failed to create LP token account. Please try again.',
            variant: 'destructive',
          });
          setIsDepositing(false);
          return;
        }
      }

      const minSharesOut = new BN(0);
      const liquidityPool = await client.findLiquidityPoolPDA();

      const poolAuthority = await client.findPoolAuthorityPDA(liquidityPool);
      const treasuryTokenAccount = getAssociatedTokenAddressSync(USDC_MINT, poolAuthority, true);

      try {
        const hasTreasuryRole = await client.hasRole(poolAuthority, AccessControlRole.Treasury);

        if (!hasTreasuryRole) {
          await client.addRole(poolAuthority, AccessControlRole.Treasury);
        }

        const treasuryTokenAccountInfo = await client.connection.getAccountInfo(
          treasuryTokenAccount,
        );
        if (!treasuryTokenAccountInfo) {
          const createTreasuryAtaIx = createAssociatedTokenAccountInstruction(
            new PublicKey(wallet.address),
            treasuryTokenAccount,
            poolAuthority,
            USDC_MINT,
          );
          const tx = new Transaction().add(createTreasuryAtaIx);
          await client.provider.sendAndConfirmLegacy(tx);
        }
      } catch (error) {
        toast({
          title: 'Failed to verify treasury accounts. Please contact support.',
          variant: 'destructive',
        });
        setIsDepositing(false);
        return;
      }

      await client.addLiquidity(
        liquidityPool,
        depositAmountBN,
        minSharesOut,
        userTokenAccount.address,
        new PublicKey(poolData.tokenVault),
        userLpAccount.address,
        new PublicKey(poolData.lpMint),
        treasuryTokenAccount,
        poolAuthority,
      );

      toast({
        title: 'Deposit successful!',
        description: 'Your deposit has been processed',
        variant: 'default',
      });
      setDepositAmount('');
      await fetchPoolData();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Treasury')) {
          toast({
            title: 'Treasury account error. Please contact support.',
            variant: 'destructive',
          });
        } else if (error.message.includes('insufficient funds')) {
          toast({
            title: 'Insufficient USDC balance for deposit',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Failed to deposit. Please try again.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Failed to deposit. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsDepositing(false);
    }
  }, [client, wallet, liquidityPool, poolData, depositAmount, isDepositValid, fetchPoolData]);

  const handleWithdraw = useCallback(async () => {
    if (!isWithdrawValid || !client || !wallet?.address || !liquidityPool || !poolData) {
      toast({
        title: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    setIsWithdrawing(true);
    try {
      const withdrawAmountBN = new BN(Number(withdrawAmount) * 1_000_000);
      const userTokenAccount = await client.getUSDCAccount(new PublicKey(wallet.address));

      let userLpAccount;
      try {
        userLpAccount = await client.getUserTokenAccount(
          new PublicKey(wallet.address),
          new PublicKey(poolData.lpMint),
        );
      } catch (error) {
        toast({
          title: 'LP token account not found. Please deposit first.',
          variant: 'destructive',
        });
        setIsWithdrawing(false);
        return;
      }

      const poolAuthority = await client.findPoolAuthorityPDA(liquidityPool);
      const treasuryTokenAccount = getAssociatedTokenAddressSync(USDC_MINT, poolAuthority, true);

      const minTokensOut = new BN(0);
      await client.removeLiquidity(
        liquidityPool,
        withdrawAmountBN,
        minTokensOut,
        userTokenAccount.address,
        new PublicKey(poolData.tokenVault),
        userLpAccount.address,
        new PublicKey(poolData.lpMint),
        treasuryTokenAccount,
        poolAuthority,
      );

      toast({
        title: 'Withdrawal successful!',
        description: 'Your withdrawal has been processed',
        variant: 'default',
      });
      setWithdrawAmount('');
      await fetchPoolData();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          toast({
            title: 'Insufficient LP tokens for withdrawal',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Failed to withdraw. Please try again.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Failed to withdraw. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsWithdrawing(false);
    }
  }, [isWithdrawValid, client, wallet, liquidityPool, poolData, withdrawAmount, fetchPoolData]);


  const randomAPY = '15.08%';



  return (
    <div className="min-h-screen w-full bg-[#010b1d]/80 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[85rem] mx-auto flex flex-col lg:flex-row gap-8 mb-8">
        <div className="flex-1 min-w-0">
          <div className="bg-white/5 border border-white/10 rounded-2xl pl-6 pr-6 pt-4 pb-4 flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-[30px] font-semibold text-primary mb-4">BLP Pool</h1>
              <div className="text-xs text-white/90 mb-4">
                <span className="font-bold text-primary">
                  The Baskt Liquidity Provider (BLP) Pool
                </span>{' '}
                is a liquidity pool where it acts as a counterparty to traders — when traders seek
                to open leverage positions, they borrow tokens from the pool.
              </div>
              <div className="text-white/80 text-xs mb-4">
                <span className="font-bold text-primary">The BLP token</span> is the liquidity
                provider token where its value is derived from:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>An index fund of USDC, SOL, ETH, WBTC, USDT.</li>
                  <li>Earn a share of trading fees and protocol growth.</li>
                  <li>
                    75% of the generated fees from trading activities are distributed to BLP
                    holders.
                  </li>
                </ul>
              </div>
              <div className="text-white/80 text-xs mb-4">
                <span className="font-bold text-primary">The APY</span>, denominated in USD, is
                calculated based on 75% of fees generated from trading activities, which does not
                include asset appreciation and traders' PnL. The generated fees are distributed back
                to holders by redepositing the fees into the pool hourly.
              </div>
            </div>
            <div className="flex flex-col items-end min-w-[180px] justify-start">
              <div className="flex items-center gap-2 text-primary text-xs font-bold mb-1">
                APY
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-block align-middle cursor-pointer">
                        <Info className="h-4 w-4 text-primary" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-xs text-xs text-white bg-[#23263a] border border-white/10"
                    >
                      APR/APY is updated weekly based on the fees generated by the pool denominated
                      in USD.
                      <br />
                      <br />
                      Fees are compounded automatically every hour.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-2xl font-extrabold text-primary">{randomAPY}</span>
              <span className="text-xs text-white/50 mt-1">Last updated at 5/29/2025</span>
            </div>
          </div>
          <div className="mt-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-6">
              <div>
                <div className="text-sm font-semibold text-white mb-1">Total Value Locked</div>
                <div className="text-3xl font-semibold text-primary mb-1">$1,554,457,666.26</div>
                <div className="text-xs text-white/50">AUM limit: $1,750,000,000</div>
              </div>
              <div>
                <div className="text-base font-semibold text-white mb-3 mt-4">
                  Liquidity Allocation
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-white/90 text-sm rounded-xl overflow-hidden">
                    <thead>
                      <tr className="bg-white/10">
                        <th className="px-4 py-2 text-left font-medium">Token</th>
                        <th className="px-4 py-2 text-left font-medium">Pool Size</th>
                        <th className="px-4 py-2 text-left font-medium">
                          <span className="flex items-center gap-1">
                            Current / Target Weightage
                            <Info className="h-4 w-4 text-white/40" />
                          </span>
                        </th>
                        <th className="px-4 py-2 text-left font-medium">Utilization</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-3 flex items-center gap-3">
                          <img
                            src="https://assets.coingecko.com/coins/images/975/standard/cardano.png"
                            alt="ADA"
                            className="w-7 h-7 rounded-full"
                          />
                          <div>
                            <div className="font-semibold text-white">ADA</div>
                            <div className="text-xs text-white/50">Cardano</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">$100,000,000.00</div>
                          <div className="text-xs text-white/50">150,000,000 ADA</div>
                        </td>
                        <td className="px-4 py-3">20.00% / 20%</td>
                        <td className="px-4 py-3">10.00%</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 flex items-center gap-3">
                          <img
                            src="https://assets.coingecko.com/coins/images/4128/standard/solana.png"
                            alt="SOL"
                            className="w-7 h-7 rounded-full"
                          />
                          <div>
                            <div className="font-semibold text-white">SOL</div>
                            <div className="text-xs text-white/50">Solana</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">$200,000,000.00</div>
                          <div className="text-xs text-white/50">4,000,000 SOL</div>
                        </td>
                        <td className="px-4 py-3">25.00% / 25%</td>
                        <td className="px-4 py-3">15.00%</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 flex items-center gap-3">
                          <img
                            src="https://assets.coingecko.com/coins/images/5/standard/dogecoin.png"
                            alt="DOGE"
                            className="w-7 h-7 rounded-full"
                          />
                          <div>
                            <div className="font-semibold text-white">DOGE</div>
                            <div className="text-xs text-white/50">Dogecoin</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">$50,000,000.00</div>
                          <div className="text-xs text-white/50">700,000,000 DOGE</div>
                        </td>
                        <td className="px-4 py-3">10.00% / 10%</td>
                        <td className="px-4 py-3">5.00%</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 flex items-center gap-3">
                          <img
                            src="https://assets.coingecko.com/coins/images/279/standard/ethereum.png"
                            alt="ETH"
                            className="w-7 h-7 rounded-full"
                          />
                          <div>
                            <div className="font-semibold text-white">ETH</div>
                            <div className="text-xs text-white/50">Ethereum</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">$300,000,000.00</div>
                          <div className="text-xs text-white/50">100,000 ETH</div>
                        </td>
                        <td className="px-4 py-3">30.00% / 30%</td>
                        <td className="px-4 py-3">20.00%</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 flex items-center gap-3">
                          <img
                            src="https://assets.coingecko.com/coins/images/1/standard/bitcoin.png"
                            alt="BTC"
                            className="w-7 h-7 rounded-full"
                          />
                          <div>
                            <div className="font-semibold text-white">BTC</div>
                            <div className="text-xs text-white/50">Bitcoin</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">$400,000,000.00</div>
                          <div className="text-xs text-white/50">10,000 BTC</div>
                        </td>
                        <td className="px-4 py-3">15.00% / 15%</td>
                        <td className="px-4 py-3">50.00%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-6">
                <div className="flex flex-row items-center justify-between w-full">
                  <span className="text-white/60 text-sm">BLP Price</span>
                  <span className="text-sm font-bold text-white">$4.491</span>
                </div>
                <div className="flex flex-row items-center justify-between w-full">
                  <span className="text-white/60 text-sm">Total Supply</span>
                  <span className="text-sm font-bold text-white">346,141,137.074 BLP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="flex flex-col gap-8 h-full justify-stretch">
            <div className="grid grid-cols-1 gap-8 items-start h-full">
              <Card className="bg-white/5 border-white/10 p-0">
                <div className="p-4">
                  <Card className="bg-white/10 border-0 rounded-2xl p-4 mb-4">
                    <div>
                      <div className="text-white/60 text-sm mb-1">Your LP</div>
                      <div className="text-2xl font-bold text-white">
                        {userLpBalance} BLP
                      </div>
                      <div className="text-xs text-white/50 mt-1">~ $0</div>
                    </div>
                  </Card>
                  <Tabs
                    value={activeTab}
                    onValueChange={(val) => setActiveTab(val as 'deposit' | 'withdraw')}
                  >
                    <TabsList className="mb-4">
                      <TabsTrigger value="deposit">Deposit</TabsTrigger>
                      <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                    </TabsList>
                    <>
  <TabsContent value="deposit">
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
      fee={calculateFee(depositAmount, true)}
      expectedOutput={calculateExpectedOutput(depositAmount, true)}
      onMaxClick={() => setDepositAmount(userUSDCBalance)}
      unit="USDC"
      tokenBalance={userUSDCBalance}
    />
  </TabsContent>
  <TabsContent value="withdraw">
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
      fee={calculateFee(withdrawAmount, false)}
      expectedOutput={calculateExpectedOutput(withdrawAmount, false)}
      onMaxClick={() => setWithdrawAmount(userLpBalance)}
      unit="BLP"
      tokenBalance={userLpBalance}
    />
  </TabsContent>
</>
                  </Tabs>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
