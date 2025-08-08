import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export const useWallet = () => {
  const { logout, authenticated, login } = usePrivy();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Wallet disconnected successfully');
      router.push('/');
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
