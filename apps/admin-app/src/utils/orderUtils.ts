export function getStatusColor(status: string) {
  switch (status) {
    case 'Pending':
      return 'text-yellow-500';
    case 'Filled':
      return 'text-green-500';
    case 'Cancelled':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

export function getActionColor(isLong: boolean) {
  return isLong ? 'text-green-500' : 'text-red-500';
}
