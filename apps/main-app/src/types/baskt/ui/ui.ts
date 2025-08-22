import { ReactNode } from 'react';

export interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export interface BasketSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  placeholder?: string;
  hideFilters?: boolean;
}

export interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export interface State {
  hasError: boolean;
  error?: Error;
}

export interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  url?: string;
  userAgent?: string;
  errorId?: string;
}

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  placeholder?: string;
  hideFilters?: boolean;
}

export interface SearchBarComponentProps {
  searchInputProps: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    className: string;
  };
  filterButtonsProps: {
    filters: Array<{ label: string; value: string }>;
    selectedFilter: string;
    onFilterChange: (filter: string) => void;
    getButtonClasses: (isSelected: boolean) => string;
    hideFilters: boolean;
  };
  containerProps: {
    className: string;
  };
}

export interface BasktModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradedBaskts: any[];
}

export type SortField = 'baskt' | 'size' | 'positionValue' | 'entryPrice' | 'currentPrice' | 'pnl';

export type SortDirection = 'asc' | 'desc';

export interface ProcessedOrder {
  orderTime: Date;
  orderType: string;
  orderSize: number;
  orderPrice: number;
  orderCollateral: number;
  limitPrice: number;
  isLong: boolean;
  basktName: string;
  basktId: string;
}

export interface ProcessedOrderHistory {
  orderTime: Date;
  orderType: string;
  orderSize: number;
  orderPrice: number;
  filledAmount: number;
  fees: number;
  status: string;
  transactionHash: string;
  isLong: boolean;
  basktName: string;
  basktId: string;
}
