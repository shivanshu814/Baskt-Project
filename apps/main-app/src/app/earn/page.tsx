'use client';

import { Card, Tabs, TabsList, TabsTrigger, TabsContent, NumberFormat, Button } from '@baskt/ui';
import { useState } from 'react';
import { useUSDCBalance } from '../../hooks/pool/useUSDCBalance';
import { useTokenBalance } from '../../hooks/pool/useTokenBalance';
import { ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { useBasktClient } from '@baskt/ui';
import { ActionCard } from '../../components/pool/ActionCard';
import { PoolInfo } from '../../components/pool/PoolInfo';
import { LiquidityAllocation } from '../../components/pool/LiquidityAllocation';
import { usePoolData } from '../../hooks/pool/usePoolData';
import { useDeposit } from '../../hooks/pool/useDeposit';
import { useWithdraw } from '../../hooks/pool/useWithdraw';
import { usePoolRefresh } from '../../hooks/pool/usePoolRefresh';
import { useBalanceRefresh } from '../../hooks/pool/useBalanceRefresh';

export default function PoolPage() {
  const { wallet } = useBasktClient();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const { poolData, liquidityPool, calculateFee, calculateExpectedOutput } = usePoolData();
  const { refreshAll } = usePoolRefresh();
  const { balance: userUSDCBalance } = useUSDCBalance();
  const { balance: userLpBalance } = useTokenBalance(poolData?.lpMint ?? '', wallet?.address ?? '');
  const { triggerBalanceRefresh, isRefreshing } = useBalanceRefresh();

  const { depositAmount, setDepositAmount, isDepositing, isDepositValid, handleDeposit } =
    useDeposit({
      poolData,
      liquidityPool,
      onSuccess: refreshAll,
    });

  const { withdrawAmount, setWithdrawAmount, isWithdrawing, isWithdrawValid, handleWithdraw } =
    useWithdraw({
      poolData,
      liquidityPool,
      onSuccess: refreshAll,
    });

  // Use real APR from pool data or default to 0.00%
  const currentAPR = poolData?.apr ? `${poolData.apr}%` : '0.00%';

  // Calculate accurate TVL from pool data
  const tvl = poolData?.totalLiquidity ? parseFloat(poolData.totalLiquidity).toLocaleString() : '0';
  const totalSupply = poolData?.totalShares
    ? parseFloat(poolData.totalShares).toLocaleString()
    : '0';

  // Calculate BLP price based on TVL and total supply
  const blpPrice =
    poolData?.totalLiquidity && poolData?.totalShares
      ? (parseFloat(poolData.totalLiquidity) / parseFloat(poolData.totalShares)).toFixed(3)
      : '0';

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[85rem] mx-auto flex flex-col lg:flex-row gap-8 mb-8">
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-4">
            <PoolInfo apy={currentAPR} lastUpdated={new Date().toLocaleDateString()} />
          </div>
          <div className="mt-8">
            <LiquidityAllocation
              tvl={tvl}
              blpPrice={blpPrice}
              totalSupply={totalSupply}
              poolData={poolData}
            />
          </div>
        </div>
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="flex flex-col gap-8 h-full justify-stretch">
            <div className="grid grid-cols-1 gap-8 items-start h-full">
              <Card className="bg-foreground/5 border-border p-0">
                <div className="p-4">
                  <Card className="bg-foreground/10 border-0 rounded-2xl p-4 mb-4">
                    <div>
                      <div className="text-muted-foreground text-sm mb-1">Your LP</div>
                      <div className="text-2xl font-bold text-foreground">
                        {Number(userLpBalance).toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })}{' '}
                        BLP
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {(() => {
                          const value =
                            parseFloat(userLpBalance || '0') * parseFloat(blpPrice || '0');
                          if (isNaN(value) || value === undefined) {
                            return '~ $0.00';
                          }
                          return (
                            <>
                              ~{' '}
                              <NumberFormat
                                value={value * 1e6}
                                isPrice={true}
                                showCurrency={true}
                              />
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </Card>
                  {/* Tabs and Refresh button in same row */}
                  <div className="flex items-center justify-between mb-4">
                    <Tabs
                      value={activeTab}
                      onValueChange={(val) => setActiveTab(val as 'deposit' | 'withdraw')}
                    >
                      <TabsList>
                        <TabsTrigger value="deposit">Deposit</TabsTrigger>
                        <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={triggerBalanceRefresh}
                      disabled={isRefreshing}
                      className="flex items-center gap-2 ml-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </div>
                  <Tabs
                    value={activeTab}
                    onValueChange={(val) => setActiveTab(val as 'deposit' | 'withdraw')}
                  >
                    <>
                      <TabsContent value="deposit">
                        <ActionCard
                          title="Deposit"
                          description="Add liquidity to the pool."
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
                          description="Remove liquidity from the pool."
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
