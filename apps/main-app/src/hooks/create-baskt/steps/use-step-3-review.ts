import { useBasktClient } from '@baskt/ui';
import { usePrivy } from '@privy-io/react-auth';

export function useStep3Review() {
  const { authenticated, login } = usePrivy();
  const { client: basktClient, wallet } = useBasktClient();

  return {
    authenticated,
    login,
    wallet,
    basktClient,
  };
}
