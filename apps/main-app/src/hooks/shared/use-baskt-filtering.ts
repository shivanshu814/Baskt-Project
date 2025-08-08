import { BasktInfo } from '@baskt/types';

export const useBasktFiltering = () => {
  const filterBaskts = (
    filteredBaskts: BasktInfo[],
    currentBasktId?: string,
    searchQuery?: string,
    maxResults: number = 8,
  ) => {
    return filteredBaskts
      ?.filter((basktItem) => basktItem.basktId !== currentBasktId)
      ?.filter((basktItem) => {
        if (!searchQuery) return true;
        return basktItem.name?.toLowerCase().includes(searchQuery.toLowerCase());
      })
      ?.slice(0, maxResults);
  };

  return { filterBaskts };
};
