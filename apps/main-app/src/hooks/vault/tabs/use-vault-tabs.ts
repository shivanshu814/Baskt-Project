import { useCallback, useState } from 'react';
import { UseVaultTabsReturn } from '../../../types/vault';

/**
 * Hook to handle vault tabs
 * @param userUSDCBalance - The user's USDC balance
 * @param userLpBalance - The user's LP balance
 * @param setDepositAmount - The function to set the deposit amount
 * @param setWithdrawAmount - The function to set the withdraw amount
 * @returns The active tab, handle tab change, handle max deposit, and handle max withdraw
 */
export function useVaultTabs(
  userUSDCBalance: string,
  userLpBalance: string,
  setDepositAmount: (amount: string) => void,
  setWithdrawAmount: (amount: string) => void,
): UseVaultTabsReturn {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');

  // handle tab change
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as 'deposit' | 'withdraw');
  }, []);

  // handle max deposit
  const handleMaxDeposit = useCallback(() => {
    setDepositAmount(userUSDCBalance);
  }, [userUSDCBalance, setDepositAmount]);

  // handle max withdraw
  const handleMaxWithdraw = useCallback(() => {
    setWithdrawAmount(userLpBalance);
  }, [userLpBalance, setWithdrawAmount]);

  return {
    activeTab,
    handleTabChange,
    handleMaxDeposit,
    handleMaxWithdraw,
  };
}
