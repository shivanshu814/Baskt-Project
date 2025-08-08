import { useEffect, useState } from 'react';
import { TradeFormData } from '../../../types/trading/orders';
import {
  calculatePercentageFromSize,
  calculateSizeFromPercentage,
} from '../../../utils/calculation/calculations';

export const useTradeForm = (usdcBalance: string) => {
  const [formData, setFormData] = useState<TradeFormData>({
    selectedPosition: 'long',
    size: '0',
    sizePercentage: 0,
    reduceOnly: false,
    tpSl: false,
  });

  useEffect(() => {
    const percentage = calculatePercentageFromSize(formData.size, usdcBalance);
    setFormData((prev) => ({ ...prev, sizePercentage: percentage }));
  }, [formData.size, usdcBalance]);

  const setSelectedPosition = (position: 'long' | 'short') => {
    setFormData((prev) => ({ ...prev, selectedPosition: position }));
  };

  const setSize = (size: string) => {
    setFormData((prev) => ({ ...prev, size }));
  };

  const setSizePercentage = (percentage: number) => {
    const size = calculateSizeFromPercentage(percentage, usdcBalance);
    setFormData((prev) => ({
      ...prev,
      sizePercentage: percentage,
      size,
    }));
  };

  const setReduceOnly = (reduceOnly: boolean) => {
    setFormData((prev) => ({ ...prev, reduceOnly }));
  };

  const setTpSl = (tpSl: boolean) => {
    setFormData((prev) => ({ ...prev, tpSl }));
  };

  const resetForm = () => {
    setFormData({
      selectedPosition: 'long',
      size: '0',
      sizePercentage: 0,
      reduceOnly: false,
      tpSl: false,
    });
  };

  return {
    formData,
    setSelectedPosition,
    setSize,
    setSizePercentage,
    setReduceOnly,
    setTpSl,
    resetForm,
  };
};
