import { useQuery } from '@tanstack/react-query';
import { useBasktClient } from '@baskt/ui';
import { OnchainPosition } from '@baskt/types';

export const usePositions = () => {
  const { client } = useBasktClient();

  return useQuery<OnchainPosition[]>({
    queryKey: ['positions'],
    queryFn: async () => {
      if (!client) throw new Error('Client not initialized');
      const positions = await client.getAllPositions();
      return positions.map((position: OnchainPosition) => ({
        ...position,
        publicKey: position.positionPDA.toString(),
      }));
    },
    enabled: !!client,
  });
};
