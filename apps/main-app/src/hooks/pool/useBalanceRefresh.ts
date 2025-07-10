import { useCallback, useState } from 'react';

export const useBalanceRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerBalanceRefresh = useCallback(async () => {
    setIsRefreshing(true);

    // Set manual refresh flag to prevent toast notifications
    if ((window as any).setManualRefreshFlag) {
      (window as any).setManualRefreshFlag();
    }

    // Only dispatch one event to prevent multiple toasts
    window.dispatchEvent(new Event('balance-updated'));

    // Add a small delay to show loading state
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  return {
    triggerBalanceRefresh,
    isRefreshing,
  };
};
