import { OnchainOrder } from '@baskt/types';

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
export interface FillPositionDialogProps {
  order: OnchainOrder | null;
  isOpen: boolean;
  onClose: () => void;
}
export interface ClosePositionDialogProps {
  order: OnchainOrder | null;
  isOpen: boolean;
  onClose: () => void;
}
