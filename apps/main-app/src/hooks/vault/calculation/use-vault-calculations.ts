import { useCallback, useMemo } from 'react';
import { VaultCalculations, VaultData, VaultMetrics } from '../../../types/vault';

/**
 * Hook to calculate vault calculations and metrics
 * @param vaultData - The vault data
 * @param depositAmount - The deposit amount
 * @param withdrawAmount - The withdraw amount
 * @param calculateFee - The function to calculate the fee
 * @param calculateExpectedOutput - The function to calculate the expected output
 * @returns The vault calculations and metrics
 */
export function useVaultCalculations(
  vaultData: VaultData | null,
  depositAmount: string,
  withdrawAmount: string,
): VaultCalculations & { metrics: VaultMetrics } {
  // calculate fee
  const calculateFee = useCallback(
    (amount: string, isDeposit: boolean): string => {
      if (!vaultData || !amount || parseFloat(amount) <= 0) return '0';

      const feeBps = isDeposit ? vaultData.depositFeeBps : vaultData.withdrawalFeeBps;
      const fee = (parseFloat(amount) * feeBps) / 10000;
      return fee.toFixed(6);
    },
    [vaultData],
  );

  // calculate expected output
  const calculateExpectedOutput = useCallback(
    (amount: string, isDeposit: boolean): string => {
      if (!vaultData || !amount || parseFloat(amount) <= 0) return '0';

      const fee = calculateFee(amount, isDeposit);
      const netAmount = parseFloat(amount) - parseFloat(fee);

      if (isDeposit) {
        const blpTokens =
          (netAmount * parseFloat(vaultData.totalShares)) / parseFloat(vaultData.totalLiquidity);
        return blpTokens.toFixed(6);
      } else {
        const usdcAmount =
          (netAmount * parseFloat(vaultData.totalLiquidity)) / parseFloat(vaultData.totalShares);
        return usdcAmount.toFixed(6);
      }
    },
    [vaultData, calculateFee],
  );

  // vault metrics calculations
  const metrics = useMemo((): VaultMetrics => {
    const currentAPR = vaultData?.apr ? `${vaultData.apr}%` : '0.00%';

    const tvl = vaultData?.totalLiquidity
      ? parseFloat(vaultData.totalLiquidity).toLocaleString()
      : '0';

    const totalSupply = vaultData?.totalShares
      ? parseFloat(vaultData.totalShares).toLocaleString()
      : '0';

    const blpPrice =
      vaultData?.totalLiquidity && vaultData?.totalShares
        ? (parseFloat(vaultData.totalLiquidity) / parseFloat(vaultData.totalShares)).toFixed(3)
        : '0';

    const actualTotalSupply = vaultData?.totalShares ? parseFloat(vaultData.totalShares) : 0;
    const totalFeesEarned = vaultData?.totalFeesEarned
      ? parseFloat(vaultData.totalFeesEarned).toLocaleString()
      : '0';

    return {
      currentAPR,
      tvl,
      totalSupply,
      blpPrice,
      actualTotalSupply,
      totalFeesEarned,
    };
  }, [vaultData]);

  // deposit fee
  const depositFee = useMemo(
    () => calculateFee(depositAmount, true),
    [calculateFee, depositAmount],
  );

  // deposit expected output
  const depositExpectedOutput = useMemo(
    () => calculateExpectedOutput(depositAmount, true),
    [calculateExpectedOutput, depositAmount],
  );

  // withdraw fee
  const withdrawFee = useMemo(
    () => calculateFee(withdrawAmount, false),
    [calculateFee, withdrawAmount],
  );

  // withdraw expected output
  const withdrawExpectedOutput = useMemo(
    () => calculateExpectedOutput(withdrawAmount, false),
    [calculateExpectedOutput, withdrawAmount],
  );

  return {
    depositFee,
    depositExpectedOutput,
    withdrawFee,
    withdrawExpectedOutput,
    calculateFee,
    calculateExpectedOutput,
    metrics,
  };
}
