import { OrderAction } from '@baskt/types';

export interface ActiveFiltersSummaryProps {
  filters: {
    basktId: string;
    userId: string;
    status: string;
    action: OrderAction | undefined;
  };
  onRemoveFilter: (key: string) => void;
}

export interface HistoryErrorProps {
  error: string;
}

export interface HistoryFiltersProps {
  filters: {
    basktId: string;
    userId: string;
    status: string;
    action: OrderAction | undefined;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export interface HistoryTableProps {
  history: HistoryItem[];
  isLoading: boolean;
}

export interface HistoryPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading: boolean;
}

export interface HistoryItem {
  id: string;
  type: 'order' | 'position';
  orderId?: string;
  positionId?: string;
  basktId: string;
  basktName?: string;
  owner: string;
  action: OrderAction;
  status: string;
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
