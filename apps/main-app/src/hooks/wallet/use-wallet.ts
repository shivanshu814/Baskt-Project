import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';

export const useWallet = () => {
  const { logout, authenticated, login } = usePrivy();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Wallet disconnected successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  const handleLogin = () => {
    login();
  };

  return {
    authenticated,
    handleLogout,
    handleLogin,
  };
};
