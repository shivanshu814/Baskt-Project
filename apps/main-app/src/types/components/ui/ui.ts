import { ReactNode } from 'react';

/**
 * Props for the SearchBar component.
 */
export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Props for the BasketSearchBar component.
 */
export interface BasketSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  placeholder?: string;
  hideFilters?: boolean;
}

/**
 * Props for the Navbar component.
 */
export interface NavbarProps {
  setSidebarOpen?: (open: boolean) => void;
}

/**
 * Props for the GlobalError component.
 */
export interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Props for the ErrorBoundary component.
 */
export interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * State for the ErrorBoundary component.
 */
export interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Interface for error information.
 */
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

export interface UseSearchProps {
  initialValue?: string;
  initialFilter?: string;
  placeholder?: string;
  hideFilters?: boolean;
}

export interface UseSearchReturn {
  searchValue: string;
  selectedFilter: string;
  placeholder: string;
  hideFilters: boolean;
  setSearchValue: (value: string) => void;
  setSelectedFilter: (filter: string) => void;
  clearSearch: () => void;
  clearFilter: () => void;
  resetSearch: () => void;
}
export interface BasktBreakdownProps {
  tradedBaskts: any[];
  isLoading: boolean;
  error: any;
}

export interface BasktModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradedBaskts: any[];
}

export type SortField = 'basket' | 'size' | 'positionValue' | 'entryPrice' | 'currentPrice' | 'pnl';
export type SortDirection = 'asc' | 'desc';

export interface Position {
  positionId: string;
  basktId: string;
  size: string;
  usdcSize: string;
  collateral: string;
  entryPrice: string;
  isLong: boolean;
  status: string;
  basktName?: string;
  currentPrice?: number;
  pnl?: number;
  pnlPercentage?: number;
}

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
