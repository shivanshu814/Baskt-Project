import { BasktInfo } from '@baskt/types';

export const filterBaskts = (baskts: BasktInfo[], searchQuery: string): BasktInfo[] => {
  if (!searchQuery) return baskts;

  const query = searchQuery.toLowerCase();
  return baskts.filter(
    (baskt) =>
      baskt.name?.toLowerCase().includes(query) ||
      baskt.assets?.some((asset) => asset.name.toLowerCase().includes(query)),
  );
};
