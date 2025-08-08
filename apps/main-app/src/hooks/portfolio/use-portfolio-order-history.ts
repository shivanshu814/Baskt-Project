import { useOrderHistory } from '../baskt/trade/use-order-history';

export function usePortfolioOrderHistory(userAddress?: string) {
  return useOrderHistory(undefined, userAddress, {
    includeBasktInfo: true,
    filterByStatus: false,
  });
}
