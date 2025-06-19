import { OrderAction, OrderStatus, PositionStatus } from '../onchain';

export interface HistoryItem {
  id: string;
  type: 'order' | 'position';
  orderId?: string;
  positionId?: string;
  basktId: string;
  basktName?: string;
  owner: string;
  action: OrderAction;
  status: OrderStatus | PositionStatus;
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
}
