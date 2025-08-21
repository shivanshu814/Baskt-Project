import { Card, CardContent, Tabs, TabsContent, TabsList, TabsTrigger } from '@baskt/ui';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { useUSDCBalance } from '../../../hooks/pool/use-usdc-balance';
import { useVaultData } from '../../../hooks/vault/use-vault-data';
import { useDeposit, useVaultTabs, useWithdraw } from '../../../hooks/vault/use-vault-operations';
import { VaultActionTabsProps } from '../../../types/vault';
import { ActionCard } from './ActionCard';

export function VaultActionTabs({
  statistics,
  userWithdrawalData,
  onVaultOperationSuccess,
}: VaultActionTabsProps) {
  const { poolData, liquidityPool } = useVaultData();
  const { balance } = useUSDCBalance();
  const userUSDCBalance = balance || '0';
  const userLpBalance = userWithdrawalData?.totalWithdrawals?.toString() || '0';

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const { isDepositing, isDepositValid, handleDeposit } = useDeposit({
    vaultData: poolData,
    liquidityPool,
    amount: depositAmount,
  });

  const { isWithdrawing, isWithdrawValid, handleWithdraw } = useWithdraw({
    vaultData: poolData,
    liquidityPool,
    amount: withdrawAmount,
  });

  const { activeTab, handleTabChange, handleMaxDeposit, handleMaxWithdraw } = useVaultTabs(
    userUSDCBalance,
    userLpBalance,
    setDepositAmount,
    setWithdrawAmount,
  );

  const handleDepositWithRefresh = async () => {
    try {
      await handleDeposit();

      setDepositAmount('');

      if (onVaultOperationSuccess) {
        onVaultOperationSuccess();
      }
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  const handleWithdrawWithRefresh = async () => {
    try {
      await handleWithdraw();

      setWithdrawAmount('');

      if (onVaultOperationSuccess) {
        onVaultOperationSuccess();
      }
    } catch (error) {
      console.error('Withdraw failed:', error);
    }
  };

  const depositFee =
    depositAmount && statistics?.fees
      ? ((parseFloat(depositAmount) * statistics.fees) / 1000).toFixed(3)
      : '0';

  const withdrawFee =
    withdrawAmount && statistics?.fees
      ? ((parseFloat(withdrawAmount) * statistics.fees) / 1000).toFixed(3)
      : '0';

  const blpPrice = statistics?.blpPrice || 1;

  const depositExpectedOutput = depositAmount
    ? (parseFloat(depositAmount) / blpPrice).toFixed(3)
    : '0';
  const withdrawExpectedOutput = withdrawAmount
    ? (parseFloat(withdrawAmount) * blpPrice).toFixed(3)
    : '0';

  return (
    <Card className="border-border border-primary/10 rounded-lg">
      <CardContent className="p-3">
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="bg-primary/10 border-primary/30">
                <TabsTrigger
                  value="deposit"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:border-primary/50 data-[state=active]:text-primary"
                >
                  Deposit
                </TabsTrigger>
                <TabsTrigger
                  value="withdraw"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:border-primary/50 data-[state=active]:text-primary"
                >
                  Withdraw
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsContent value="deposit">
              <ActionCard
                title="Deposit"
                description="Add liquidity to the vault."
                icon={<ArrowUpRight className="h-5 w-5 text-green-400" />}
                inputValue={depositAmount}
                setInputValue={setDepositAmount}
                onAction={handleDepositWithRefresh}
                actionLabel="Deposit"
                loading={isDepositing}
                color="green"
                disabled={!isDepositValid}
                fee={depositFee}
                expectedOutput={depositExpectedOutput}
                onMaxClick={handleMaxDeposit}
                unit="USDC"
                tokenBalance={userUSDCBalance}
              />
            </TabsContent>
            <TabsContent value="withdraw">
              <ActionCard
                title="Withdraw"
                description="Remove liquidity from the vault."
                icon={<ArrowDownRight className="h-5 w-5 text-red-400" />}
                inputValue={withdrawAmount}
                setInputValue={setWithdrawAmount}
                onAction={handleWithdrawWithRefresh}
                actionLabel="Withdraw"
                loading={isWithdrawing}
                color="red"
                disabled={!isWithdrawValid}
                fee={withdrawFee}
                expectedOutput={withdrawExpectedOutput}
                onMaxClick={handleMaxWithdraw}
                unit="BLP"
                tokenBalance={userLpBalance}
              />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
