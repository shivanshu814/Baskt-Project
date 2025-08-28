import { useBasktClient } from '@baskt/ui';
import { trpc } from '../../lib/api/trpc';

export function getPortfolio() {
  const { client } = useBasktClient();
  const userAddress = client?.wallet?.address?.toString();

  const portfolioQuery = trpc.portfolio.getPortfolioData.useQuery(
    {
      userId: userAddress || '',
    },
    {
      enabled: true,
      refetchInterval: 5 * 60 * 1000,
      staleTime: 4 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  );

  return {
    data: 'data' in (portfolioQuery.data || {}) ? (portfolioQuery.data as any).data : null,
    isLoading: portfolioQuery.isLoading,
    isError: portfolioQuery.isError,
    error: portfolioQuery.error,
    refetch: portfolioQuery.refetch,
  };
}
