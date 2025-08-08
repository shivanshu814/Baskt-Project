import { useBasktClient } from '@baskt/ui';
import { OnchainPosition } from '@baskt/types';
import { trpc } from '../../utils/trpc';

export const usePositions = () => {
  const { client } = useBasktClient();

  // Fetch combined positions (onchain + offchain) from backend MongoDB
  const {
    data: backendPositions,
    isLoading,
    error,
  } = trpc.position.getPositions.useQuery(
    {},
    {
      refetchInterval: 10 * 1000, // Refetch every 10 seconds
      staleTime: 0,
      cacheTime: 0,
    },
  );

  // Determine which data to use
  const positions = backendPositions?.success && backendPositions.data ? backendPositions.data : [];

  const isBackendData = backendPositions?.success && !!backendPositions.data;

  return {
    positions,
    isLoading,
    error,
    isBackendData,
  };
};
