import { useCallback } from 'react';
import { calculateFee, calculateExpectedOutput } from '../../utils/pool/pool-calculations';
import type { UsePoolCalculationsProps } from '../../types/pool';

export const usePoolCalculations = ({ poolData }: UsePoolCalculationsProps) => {
  const getFee = useCallback(
    (amount: string, isDeposit: boolean) => {
      return calculateFee(amount, isDeposit, poolData);
    },
    [poolData],
  );

  const getExpectedOutput = useCallback(
    (amount: string, isDeposit: boolean) => {
      return calculateExpectedOutput(amount, isDeposit, poolData);
    },
    [poolData],
  );

  return {
    calculateFee: getFee,
    calculateExpectedOutput: getExpectedOutput,
  };
};
