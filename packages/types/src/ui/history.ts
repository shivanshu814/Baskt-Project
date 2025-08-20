import { OrderAction, OnchainOrderStatus, PositionStatus } from '../onchain';

export interface HistoryItem {
  id: string;
  type: 'order' | 'position';
  orderId?: number;
  positionId?: string;
  basktId: string;
  basktName?: string;
  owner: string;
  action: OrderAction;
  status: OnchainOrderStatus | PositionStatus;
  size: string;
  collateral: string;
  isLong: boolean;
  entryPrice?: string;
  exitPrice?: string;
  pnl?: string;
  pnlPercentage?: string;
  timestamp: string;
  createTx?: string;
  fillTx?: string;
  openTx?: string;
  closeTx?: string;
  // Partial close properties
  isPartialClose?: boolean;
  partialCloseAmount?: string;
  remainingSize?: string;
}
