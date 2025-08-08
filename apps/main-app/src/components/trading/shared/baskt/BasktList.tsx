import { useBasktFiltering } from '../../../../hooks/shared/use-baskt-filtering';
import { BasktListProps } from '../../../../types/baskt';
import { NoResultsMessage } from '../helper/NoResultsMessage';
import { BasktListItem } from './BasktListItem';

export function BasktList({
  filteredBaskts,
  currentBasktId,
  searchQuery,
  onBasktSelect,
  onClose,
}: BasktListProps) {
  const { filterBaskts } = useBasktFiltering();

  const filteredResults = filterBaskts(filteredBaskts, currentBasktId, searchQuery);

  if (searchQuery && filteredResults?.length === 0) {
    return <NoResultsMessage />;
  }

  return (
    <div className="max-h-60 overflow-y-auto">
      {filteredResults?.map((basktItem, index) => (
        <BasktListItem
          key={basktItem.basktId || index}
          basktItem={basktItem}
          onBasktSelect={onBasktSelect}
          onClose={onClose}
        />
      ))}
    </div>
  );
}
