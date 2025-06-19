import { OrderStatus, PositionStatus } from '@baskt/types';

export function getStatusColor(status: string) {
  switch (status) {
    case OrderStatus.PENDING:
    case 'Pending':
      return 'text-yellow-500';
    case OrderStatus.FILLED:
    case 'Filled':
      return 'text-green-500';
    case OrderStatus.CANCELLED:
    case 'Cancelled':
      return 'text-red-500';
    case PositionStatus.OPEN:
    case 'OPEN':
      return 'text-blue-500';
    case PositionStatus.CLOSED:
    case 'CLOSED':
      return 'text-gray-500';
    case PositionStatus.LIQUIDATED:
    case 'LIQUIDATED':
      return 'text-red-600';
    default:
      return 'text-gray-500';
  }
}

export function getActionColor(isLong: boolean) {
  return isLong ? 'text-green-500' : 'text-red-500';
}
