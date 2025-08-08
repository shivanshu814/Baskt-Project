import { StatusType } from '../../types/components/shared/status';

// Form validation
export const validateCloseAmount = (amount: string, positionSize: number): string | null => {
  const numValue = parseFloat(amount);

  if (isNaN(numValue) || numValue < 0) {
    return 'Please enter a valid amount';
  }

  if (numValue > positionSize) {
    return `Amount cannot exceed ${positionSize}`;
  }

  if (numValue <= 0) {
    return 'Please enter a valid amount';
  }

  return null;
};

export const validateSize = (size: string): boolean => {
  const sizeNum = Number(size);
  return !isNaN(sizeNum) && sizeNum > 0;
};

export const validatePercentage = (percentage: number): boolean => {
  return percentage >= 0 && percentage <= 100;
};

export const validateTradeForm = (formData: any): boolean => {
  return validateSize(formData.size) && validatePercentage(formData.sizePercentage);
};

export const validateAmount = (value: string, maxAmount: number): boolean => {
  const numValue = parseFloat(value);
  return !isNaN(numValue) && numValue >= 0 && numValue <= maxAmount;
};

// Status validation
export const getStatusColor = (status: StatusType): string => {
  switch (status) {
    case 'operational':
      return 'text-green-400';
    case 'warning':
      return 'text-yellow-400';
    case 'error':
      return 'text-red-400';
    default:
      return 'text-green-400';
  }
};

export const getStatusDotColor = (status: StatusType): string => {
  switch (status) {
    case 'operational':
      return 'bg-green-400';
    case 'warning':
      return 'bg-yellow-400';
    case 'error':
      return 'bg-red-400';
    default:
      return 'bg-green-400';
  }
};

export const getStatusPulseColor = (status: StatusType): string => {
  switch (status) {
    case 'operational':
      return 'bg-green-400/80';
    case 'warning':
      return 'bg-yellow-400/80';
    case 'error':
      return 'bg-red-400/80';
    default:
      return 'bg-green-400/80';
  }
};
