export interface Order {
  owner: string;
  orderId: string;
  basktId: string;
  size: number;
  collateral: number;
  isLong: boolean;
  action: 'Open' | 'Close';
  status: 'Pending' | 'Filled' | 'Cancelled';
  timestamp: number;
  targetPosition?: string;
}
