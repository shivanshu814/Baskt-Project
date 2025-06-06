import { useQuery } from '@tanstack/react-query';
import { useBasktClient } from '@baskt/ui';
import { Position } from '../types/position';

export const usePositions = () => {
  const { client } = useBasktClient();

  return useQuery<Position[]>({
    queryKey: ['positions'],
    queryFn: async () => {
      if (!client) throw new Error('Client not initialized');
      const positions = await (client as any).getAllPositionsRaw(); // eslint-disable-line
      // eslint-disable-next-line
      return positions.map((position: any) => ({
        ...position.account,
        publicKey: position.publicKey,
      }));
    },
    enabled: !!client,
  });
};
