import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { UseFilteredBasktsProps, UseFilteredBasktsReturn } from '../../types/baskt';

// get filtered baskts
export function useFilteredBaskts({
  combinedBaskts,
  searchQuery,
  includeCurrentBaskt = true,
}: UseFilteredBasktsProps): UseFilteredBasktsReturn {
  const params = useParams();

  return useMemo(() => {
    if (!combinedBaskts?.length) {
      return { filteredBaskts: [], currentBaskt: undefined };
    }

    let filteredBaskts = searchQuery
      ? filterBasktsByQuery(combinedBaskts, searchQuery)
      : combinedBaskts;

    const currentBaskt = findCurrentBaskt(combinedBaskts, params?.id as string);

    if (!includeCurrentBaskt && currentBaskt) {
      filteredBaskts = removeCurrentBaskt(filteredBaskts, currentBaskt);
    }

    return { filteredBaskts, currentBaskt };
  }, [combinedBaskts, searchQuery, params?.id, includeCurrentBaskt]);
}

function filterBasktsByQuery(baskts: any[], query: string) {
  const searchTerm = query.toLowerCase();

  return baskts.filter((basktData) => {
    const name = basktData.baskt?.name || basktData.name;
    const basktId = basktData.baskt?.basktId || basktData.basktId;

    if (name?.toLowerCase().includes(searchTerm) || basktId?.toLowerCase().includes(searchTerm)) {
      return true;
    }

    return basktData.assets?.some(
      (asset: any) =>
        asset.ticker?.toLowerCase().includes(searchTerm) ||
        asset.name?.toLowerCase().includes(searchTerm),
    );
  });
}

function findCurrentBaskt(baskts: any[], basktId?: string) {
  if (!basktId || !baskts?.length) {
    return baskts[0];
  }

  return baskts.find((baskt) => (baskt.baskt?.basktId || baskt.basktId) === basktId) || baskts[0];
}

function removeCurrentBaskt(baskts: any[], currentBaskt: any) {
  const currentId = currentBaskt?.baskt?.basktId || currentBaskt?.basktId;

  return baskts.filter((basktItem) => {
    const itemId = basktItem.baskt?.basktId || basktItem.basktId;
    return itemId !== currentId;
  });
}
