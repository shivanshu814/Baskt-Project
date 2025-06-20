'use client';

import { Card, Tabs, TabsList, TabsTrigger, TabsContent } from '@baskt/ui';
import { useState } from 'react';
import { useUSDCBalance } from '../../hooks/pool/useUSDCBalance';
import { useTokenBalance } from '../../hooks/pool/useTokenBalance';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useBasktClient } from '@baskt/ui';
import { ActionCard } from '../../components/pool/ActionCard';
import { PoolInfo } from '../../components/pool/PoolInfo';
import { LiquidityAllocation } from '../../components/pool/LiquidityAllocation';
import { usePoolData } from '../../hooks/pool/usePoolData';
import { useDeposit } from '../../hooks/pool/useDeposit';
import { useWithdraw } from '../../hooks/pool/useWithdraw';
import { usePoolRefresh } from '../../hooks/pool/usePoolRefresh';
import { poolAllocations } from '../../data/pool-allocations';

export default function PoolPage() {
  const { wallet } = useBasktClient();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const { poolData, liquidityPool, calculateFee, calculateExpectedOutput } = usePoolData();
  const { refreshAll } = usePoolRefresh();
  const { balance: userUSDCBalance } = useUSDCBalance();
  const { balance: userLpBalance } = useTokenBalance(poolData?.lpMint ?? '', wallet?.address ?? '');

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

  const randomAPY = '15.08%';

  return (
    <div className="min-h-screen w-full bg-[#010b1d]/80 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[85rem] mx-auto flex flex-col lg:flex-row gap-8 mb-8">
        <div className="flex-1 min-w-0">
          <PoolInfo apy={randomAPY} lastUpdated="5/29/2025" />
          <div className="mt-8">
            <LiquidityAllocation
              tvl="1,554,457,666.26"
              aumLimit="1,750,000,000"
              blpPrice="4.491"
              totalSupply="346,141,137.074"
              allocations={poolAllocations}
            />
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
                      <div className="text-2xl font-bold text-white">{userLpBalance} BLP</div>
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
