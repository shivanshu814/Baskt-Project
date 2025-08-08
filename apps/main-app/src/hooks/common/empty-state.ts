import { Search, Sparkles, User } from 'lucide-react';
import { useMemo } from 'react';
import { EMPTY_STATE_CONFIGS } from '../../utils/empty/empty';

export const useEmptyState = (
  type: 'noBasktsFound' | 'walletConnect' | 'noBasktsCreated',
  onClick: () => void,
) => {
  const config = useMemo(() => {
    switch (type) {
      case 'noBasktsFound':
        return EMPTY_STATE_CONFIGS.noBasktsFound(onClick);
      case 'walletConnect':
        return EMPTY_STATE_CONFIGS.walletConnect(onClick);
      case 'noBasktsCreated':
        return EMPTY_STATE_CONFIGS.noBasktsCreated(onClick);
      default:
        return EMPTY_STATE_CONFIGS.noBasktsFound(onClick);
    }
  }, [type, onClick]);

  const icon = useMemo(() => {
    switch (type) {
      case 'noBasktsFound':
        return Search;
      case 'walletConnect':
        return User;
      case 'noBasktsCreated':
        return Sparkles;
      default:
        return Search;
    }
  }, [type]);

  return {
    config,
    icon,
  };
};
