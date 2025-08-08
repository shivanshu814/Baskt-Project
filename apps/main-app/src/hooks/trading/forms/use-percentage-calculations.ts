import { useEffect } from 'react';

export const usePercentageCalculations = (
  size: string,
  usdcBalance: string,
  setSizePercentage: (percentage: number) => void,
) => {
  useEffect(() => {
    const usdcBalanceNum = Number(usdcBalance) || 0;
    if (usdcBalanceNum > 0 && size) {
      const sizeNum = Number(size) || 0;
      const percentage = Math.min((sizeNum / usdcBalanceNum) * 100, 100);
      setSizePercentage(Math.round(percentage));
    } else {
      setSizePercentage(0);
    }
  }, [size, usdcBalance, setSizePercentage]);

  const calculateSizeFromPercentage = (percentage: number, usdcBalance: string) => {
    const usdcBalanceNum = Number(usdcBalance) || 0;
    if (usdcBalanceNum > 0) {
      const newSize = (percentage / 100) * usdcBalanceNum;
      return newSize.toFixed(2);
    }
    return '0';
  };

  const handlePercentageChange = (
    percentage: number,
    usdcBalance: string,
    setSize: (size: string) => void,
    setSizePercentage: (percentage: number) => void,
  ) => {
    const newSize = calculateSizeFromPercentage(percentage, usdcBalance);
    setSize(newSize);
    setSizePercentage(percentage);
  };

  return {
    calculateSizeFromPercentage,
    handlePercentageChange,
  };
};
