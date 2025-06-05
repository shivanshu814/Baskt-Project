import { BasktInfo } from '@baskt/types';
import { SortOption } from '@baskt/ui/types/constants';

export const sortBaskts = (baskts: BasktInfo[], sortBy: SortOption): BasktInfo[] => {
  const sorted = [...baskts];
  switch (sortBy) {
    case 'popular':
      return sorted.sort((a, b) => (b.aum || 0) - (a.aum || 0));
    case 'newest':
      return sorted.sort(
        (a, b) => (b.creationDate?.getTime() || 0) - (a.creationDate?.getTime() || 0),
      );
    case 'performance':
      return sorted.sort((a, b) => (b.change24h || 0) - (a.change24h || 0));
    default:
      return sorted;
  }
};
