import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { usePoolData } from '../../hooks/pool/usePoolData';
import { useDeposit } from '../../hooks/pool/useDeposit';
import { useWithdraw } from '../../hooks/pool/useWithdraw';
import { useUserBalances } from '../../hooks/pool/useUserBalances';
import { PoolDeposit } from './PoolDeposit';
import { PoolWithdraw } from './PoolWithdraw';

export const Pool = () => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const {
    poolData,
    liquidityPool,
    isLoading: isPoolLoading,
    calculateFee,
    calculateExpectedOutput,
    fetchPoolData,
  } = usePoolData();
  const {
    usdcBalance,
    lpBalance,
    isLoading: isBalanceLoading,
    fetchBalances,
  } = useUserBalances({ poolData });

  const handleSuccess = () => {
    fetchPoolData();
    fetchBalances();
  };

  const { depositAmount, setDepositAmount, isDepositing, isDepositValid, handleDeposit } =
    useDeposit({
      poolData,
      liquidityPool,
      onSuccess: handleSuccess,
    });

  const { withdrawAmount, setWithdrawAmount, isWithdrawing, isWithdrawValid, handleWithdraw } =
    useWithdraw({
      poolData,
      liquidityPool,
      onSuccess: handleSuccess,
    });

  const isLoading = isPoolLoading || isBalanceLoading;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Liquidity Pool</CardTitle>
        <CardDescription>Deposit USDC to earn rewards or withdraw your liquidity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'deposit'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
            onClick={() => setActiveTab('deposit')}
          >
            Deposit
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'withdraw'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
            onClick={() => setActiveTab('withdraw')}
          >
            Withdraw
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {activeTab === 'deposit' ? (
              <PoolDeposit
                depositAmount={depositAmount}
                setDepositAmount={setDepositAmount}
                isDepositing={isDepositing}
                isDepositValid={isDepositValid}
                handleDeposit={handleDeposit}
                usdcBalance={usdcBalance}
                calculateFee={calculateFee}
                calculateExpectedOutput={calculateExpectedOutput}
              />
            ) : (
              <PoolWithdraw
                withdrawAmount={withdrawAmount}
                setWithdrawAmount={setWithdrawAmount}
                isWithdrawing={isWithdrawing}
                isWithdrawValid={isWithdrawValid}
                handleWithdraw={handleWithdraw}
                lpBalance={lpBalance}
                calculateFee={calculateFee}
                calculateExpectedOutput={calculateExpectedOutput}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
