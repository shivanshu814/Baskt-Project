import { createStandardEmptyState } from '../../lib/empty/empty-state';
import { EmptyStateBaseProps } from '../../types/baskt';

export const createEmptyStateConfig = (
  title: string,
  description: string,
  buttonText: string,
  icon: React.ReactNode,
  onButtonClick: () => void,
): EmptyStateBaseProps =>
  createStandardEmptyState(title, description, buttonText, icon, onButtonClick);

export const EMPTY_STATE_CONFIGS = {
  noBasktsFound: (onCreateClick: () => void) =>
    createEmptyStateConfig(
      'No baskts found',
      "We couldn't find any baskts matching your search. Try different keywords or create your own!",
      'Create Your Own Baskt',
      'search',
      onCreateClick,
    ),
  walletConnect: (onConnectClick: () => void) =>
    createEmptyStateConfig(
      'Connect Your Wallet',
      'Please connect your wallet to view your created baskts and manage your portfolio.',
      'Connect Wallet',
      'user',
      onConnectClick,
    ),
  noBasktsCreated: (onCreateClick: () => void) =>
    createEmptyStateConfig(
      'Start Your Baskt Journey',
      "You haven't created any baskts yet. Create your first baskt and start building your portfolio with AI-powered rebalancing!",
      'Create Your First Baskt',
      'sparkles',
      onCreateClick,
    ),
};
