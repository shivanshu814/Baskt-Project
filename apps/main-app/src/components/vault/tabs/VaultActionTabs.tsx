import {
  Card,
  CardContent,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useBasktClient,
} from '@baskt/ui';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useTokenBalance } from '../../../hooks/pool/use-token-balance';
import { useUSDCBalance } from '../../../hooks/pool/use-usdc-balance';
import { useVaultCalculations } from '../../../hooks/vault/calculation/use-vault-calculations';
import { useDeposit } from '../../../hooks/vault/deposit/use-deposit';
import { useVaultTabs } from '../../../hooks/vault/tabs/use-vault-tabs';
import { useWithdraw } from '../../../hooks/vault/withdraw/use-withdraw';
import { VaultActionTabsProps } from '../../../types/vault';
import { ActionCard } from './ActionCard';

export function VaultActionTabs({ vaultData, liquidityPool }: VaultActionTabsProps) {
  const { wallet } = useBasktClient();

  const { balance: userUSDCBalance } = useUSDCBalance();
  const { balance: userLpBalance } = useTokenBalance(
    vaultData?.lpMint ?? '',
    wallet?.address ?? '',
  );

  // calculate deposit
  const { depositAmount, setDepositAmount, isDepositing, isDepositValid, handleDeposit } =
    useDeposit({
      vaultData,
      liquidityPool,
    });

  // calculate withdraw
  const { withdrawAmount, setWithdrawAmount, isWithdrawing, isWithdrawValid, handleWithdraw } =
    useWithdraw({
      vaultData,
      liquidityPool,
    });

  // calculate vault calculations and metrics
  const calculations = useVaultCalculations(vaultData, depositAmount, withdrawAmount);

  const { activeTab, handleTabChange, handleMaxDeposit, handleMaxWithdraw } = useVaultTabs(
    userUSDCBalance,
    userLpBalance,
    setDepositAmount,
    setWithdrawAmount,
  );

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
                onAction={handleDeposit}
                actionLabel="Deposit"
                loading={isDepositing}
                color="green"
                disabled={!isDepositValid}
                fee={calculations.depositFee}
                expectedOutput={calculations.depositExpectedOutput}
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
                onAction={handleWithdraw}
                actionLabel="Withdraw"
                loading={isWithdrawing}
                color="red"
                disabled={!isWithdrawValid}
                fee={calculations.withdrawFee}
                expectedOutput={calculations.withdrawExpectedOutput}
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
