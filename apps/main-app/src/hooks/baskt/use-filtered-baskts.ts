import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { UseFilteredBasktsProps, UseFilteredBasktsReturn } from '../../types/baskt';

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

    let baskts = combinedBaskts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      baskts = baskts.filter((basktData) => {
        const name = basktData.baskt?.name || basktData.name;
        const basktId = basktData.baskt?.basktId || basktData.basktId;

        return (
          name?.toLowerCase().includes(query) ||
          basktId?.toLowerCase().includes(query) ||
          basktData.assets?.some(
            (asset: any) =>
              asset.ticker?.toLowerCase().includes(query) ||
              asset.name?.toLowerCase().includes(query),
          )
        );
      });
    }

    const basktId = params?.id as string;

    let currentBaskt;
    if (!basktId || !combinedBaskts?.length) {
      currentBaskt = baskts?.[0] || combinedBaskts?.[0];
    } else {
      const foundBaskt = combinedBaskts.find(
        (baskt) => (baskt.baskt?.basktId || baskt.basktId) === basktId,
      );
      currentBaskt = foundBaskt || baskts?.[0] || combinedBaskts?.[0];
    }

    let finalFilteredBaskts = baskts;
    if (!includeCurrentBaskt && currentBaskt) {
      finalFilteredBaskts = baskts.filter((basktItem) => {
        const itemId = basktItem.baskt?.basktId || basktItem.basktId;
        const currentId = currentBaskt?.baskt?.basktId || currentBaskt?.basktId;
        return itemId !== currentId;
      });
    }

    return { filteredBaskts: finalFilteredBaskts, currentBaskt };
  }, [combinedBaskts, searchQuery, params?.id, includeCurrentBaskt]);
}
