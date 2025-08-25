import { useEffect, useState } from 'react';
import { trpc } from '../../utils/trpc';

export const useOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use tRPC query to fetch orders from backend
  const { data, isLoading: queryLoading, error: queryError } = trpc.order.getOrders.useQuery({});

  useEffect(() => {
    if (data?.success && data.data) {
      setOrders(data.data);
      setError(null);
    } else if (data?.success === false) {
      setError(data.message || 'Failed to fetch orders');
    }
    setIsLoading(false);
  }, [data]);

  useEffect(() => {
    if (queryError) {
      setError(queryError.message || 'Failed to fetch orders');
      setIsLoading(false);
    }
  }, [queryError]);

  return {
    orders,
    isLoading: isLoading || queryLoading,
    error,
  };
};
