import { useCallback, useMemo } from 'react';
import { VaultCalculations, VaultData, VaultMetrics } from '../../types/vault';
import {
  calculateAPY,
  calculateBLPPrice,
  calculateDepositOutput,
  calculateFeeAmount,
  calculateWithdrawOutput,
  DAYS_IN_YEAR,
  DEFAULT_DECIMAL_PLACES,
  formatNumber,
  formatPercentage,
  HIGH_YIELD_THRESHOLD,
  MONTHS_IN_YEAR,
  parseSafeFloat,
  WEEKS_IN_YEAR,
} from '../../utils/vault-calculations';

// calculate apy
export function useVaultAPY(vaultData: VaultData | null) {
  return useMemo(() => {
    if (!vaultData) {
      return {
        apy: formatPercentage(0),
        apr: formatPercentage(0),
        dailyRate: formatPercentage(0, 4),
        weeklyRate: formatPercentage(0),
        monthlyRate: formatPercentage(0),
        totalFeesEarned: '0',
        recentFees: '0',
        feeEvents: 0,
        isHighYield: false,
        originalApr: 0,
      };
    }

    const apr = parseSafeFloat(vaultData.apr);
    const apy = calculateAPY(apr);
    const dailyRate = apr / DAYS_IN_YEAR;
    const weeklyRate = apr / WEEKS_IN_YEAR;
    const monthlyRate = apr / MONTHS_IN_YEAR;

    const totalFeesEarned = vaultData.totalFeesEarned || '0';
    const recentFees = vaultData.recentFeeData?.totalFeesToBlp || '0';
    const feeEvents = vaultData.recentFeeData?.eventCount || 0;

    return {
      apy: formatPercentage(apy),
      apr: formatPercentage(apr),
      dailyRate: formatPercentage(dailyRate, 4),
      weeklyRate: formatPercentage(weeklyRate),
      monthlyRate: formatPercentage(monthlyRate),
      totalFeesEarned: formatNumber(parseSafeFloat(totalFeesEarned)),
      recentFees: formatNumber(parseSafeFloat(recentFees)),
      feeEvents,
      isHighYield: apr > HIGH_YIELD_THRESHOLD,
      originalApr: apr,
    };
  }, [vaultData]);
}

// calculate metrics
export function useVaultMetrics(vaultData: VaultData | null): VaultMetrics {
  return useMemo(() => {
    const currentAPR = vaultData?.apr ? `${vaultData.apr}%` : '0.00%';
    const tvl = vaultData?.totalLiquidity
      ? formatNumber(parseSafeFloat(vaultData.totalLiquidity))
      : '0';
    const totalSupply = vaultData?.totalShares
      ? formatNumber(parseSafeFloat(vaultData.totalShares))
      : '0';
    const actualTotalSupply = parseSafeFloat(vaultData?.totalShares);
    const totalFeesEarned = vaultData?.totalFeesEarned
      ? formatNumber(parseSafeFloat(vaultData.totalFeesEarned))
      : '0';

    // Calculate BLP price
    const blpPrice = calculateBLPPrice(
      vaultData?.totalLiquidity || '0',
      vaultData?.totalShares || '0',
    );

    return {
      currentAPR,
      tvl,
      totalSupply,
      blpPrice,
      actualTotalSupply,
      totalFeesEarned,
    };
  }, [vaultData]);
}

// calculate fees
export function useVaultFees(vaultData: VaultData | null) {
  const calculateFee = useCallback(
    (amount: string, isDeposit: boolean): string => {
      if (!vaultData) return '0';

      const feeBps = isDeposit ? vaultData.depositFeeBps : vaultData.withdrawalFeeBps;
      const fee = calculateFeeAmount(amount, feeBps);
      return fee.toFixed(DEFAULT_DECIMAL_PLACES);
    },
    [vaultData],
  );

  const calculateExpectedOutput = useCallback(
    (amount: string, isDeposit: boolean): string => {
      if (!vaultData) return '0';

      const amountValue = parseSafeFloat(amount);
      if (amountValue <= 0) return '0';

      const fee = calculateFeeAmount(
        amount,
        isDeposit ? vaultData.depositFeeBps : vaultData.withdrawalFeeBps,
      );
      const netAmount = amountValue - fee;

      const output = isDeposit
        ? calculateDepositOutput(netAmount, vaultData.totalShares, vaultData.totalLiquidity)
        : calculateWithdrawOutput(netAmount, vaultData.totalShares, vaultData.totalLiquidity);

      return output.toFixed(DEFAULT_DECIMAL_PLACES);
    },
    [vaultData],
  );

  return { calculateFee, calculateExpectedOutput };
}

// calculate vault calculations
export function useVaultCalculations(
  vaultData: VaultData | null,
  depositAmount: string,
  withdrawAmount: string,
): VaultCalculations & { metrics: VaultMetrics } {
  const { calculateFee, calculateExpectedOutput } = useVaultFees(vaultData);
  const metrics = useVaultMetrics(vaultData);

  const depositFee = useMemo(
    () => calculateFee(depositAmount, true),
    [calculateFee, depositAmount],
  );

  const depositExpectedOutput = useMemo(
    () => calculateExpectedOutput(depositAmount, true),
    [calculateExpectedOutput, depositAmount],
  );

  const withdrawFee = useMemo(
    () => calculateFee(withdrawAmount, false),
    [calculateFee, withdrawAmount],
  );

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
