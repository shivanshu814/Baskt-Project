'use client';

import { Providers } from './Providers';
import { Navbar } from './Navbar';
import { FeedbackButton } from './FeedbackButton';
import { AccessCodeEntry } from '../access/AccessCodeEntry';
import { useAccessCode, useWalletAuthorization } from '../../hooks/useAccessCode';
import { TRPCProvider } from '../../providers/TRPCProvider';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { BalanceNotification } from './BalanceNotification';

interface ClientLayoutProps {
  children: React.ReactNode;
}

function AppContent({ children }: { children: React.ReactNode }) {
  // const hasAccess = true;
  const { hasAccess, grantAccess, clearAccess, initializeAccessState } = useAccessCode();
  const { user, authenticated } = usePrivy();
  const { walletHasAccess } = useWalletAuthorization(user?.wallet?.address);
  const hasShownAutoLoginToast = useRef(false);
  const lastWalletAddress = useRef<string | null>(null);

  useEffect(() => {
    if (!authenticated && hasAccess === null) {
      initializeAccessState();
      return;
    }

    if (!authenticated) {
      if (hasAccess) {
        clearAccess();
      }
      hasShownAutoLoginToast.current = false;
      lastWalletAddress.current = null;
      return;
    }

    if (authenticated && user?.wallet?.address) {
      const currentWallet = user.wallet.address;

      if (lastWalletAddress.current && lastWalletAddress.current !== currentWallet) {
        toast.error('Different wallet detected. Please enter access code again.');
        hasShownAutoLoginToast.current = false;
      }

      lastWalletAddress.current = currentWallet;

      if (walletHasAccess && !hasShownAutoLoginToast.current) {
        grantAccess(currentWallet);
        toast.success(
          `Welcome back! Auto-login successful for ${currentWallet.slice(
            0,
            4,
          )}...${currentWallet.slice(-4)}`,
        );
        hasShownAutoLoginToast.current = true;
      }
    }
  }, [
    authenticated,
    user?.wallet?.address,
    hasAccess,
    walletHasAccess,
    grantAccess,
    clearAccess,
    initializeAccessState,
  ]);

  if (hasAccess === null && authenticated && user?.wallet?.address) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="text-white/80">Checking access...</div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <AccessCodeEntry onSuccess={grantAccess} />;
  }

  return (
    <>
      <Navbar />
      <main className="pt-16">{children}</main>
      <FeedbackButton />
      <BalanceNotification />
    </>
  );
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <TRPCProvider>
      <Providers>
        <AppContent>{children}</AppContent>
      </Providers>
    </TRPCProvider>
  );
}
