import { useMemo } from 'react';
import { useUSDCBalance } from '../pool/use-usdc-balance';
import { usePortfolioPositions } from './use-portfolio-positions';

export const usePortfolioSummary = () => {
  const { balance, loading, error } = useUSDCBalance();
  const { positions, isLoading: positionsLoading } = usePortfolioPositions();

  const portfolioData = useMemo(() => {
    const totalCollateral = positions.reduce((total: number, position: any) => {
      const collateral = position.collateral ? Number(position.collateral) / 1e6 : 0;
      return total + collateral;
    }, 0);

    const totalPnL = positions.reduce((total: number, position: any) => {
      return total + (position.pnl || 0);
    }, 0);

    const percentagePnL = totalCollateral > 0 ? (totalPnL / totalCollateral) * 100 : 0;
    const totalPortfolioValue = Number(balance || 0) + totalCollateral;

    return {
      usdcBalance: Number(balance || 0),
      totalCollateral,
      totalPnL,
      percentagePnL,
      totalPortfolioValue,
      isLoading: loading || positionsLoading,
      error,
    };
  }, [balance, loading, error, positions, positionsLoading]);

  return portfolioData;
};
