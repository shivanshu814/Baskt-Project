import { StatusType } from '../../types/baskt/status/status';

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

export const validatePercentage = (percentage: number): boolean => {
  return percentage >= 0 && percentage <= 100;
};

export const validateAmount = (value: string, maxAmount: number): boolean => {
  const numValue = parseFloat(value);
  return !isNaN(numValue) && numValue >= 0 && numValue <= maxAmount;
};

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

export const getOrderStatusColor = (status: string): string => {
  switch (status) {
    case 'FILLED':
      return 'text-green-500';
    case 'PENDING':
      return 'text-yellow-500';
    case 'CANCELLED':
      return 'text-red-500';
    default:
      return 'text-gray-500';
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
