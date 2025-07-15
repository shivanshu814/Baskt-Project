'use client';

import { useState, useCallback } from 'react';
import { trpc } from '../utils/common/trpc';
import { toast } from 'sonner';

export function useAccessCode() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [authorizedWallet, setAuthorizedWallet] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const revokeWalletAccessMutation = trpc.accessCode.revokeWalletAccess.useMutation();
  const validateCodeMutation = trpc.accessCode.validate.useMutation();
  const autoFaucetMutation = trpc.faucet.autoFaucet.useMutation();

  const initializeAccessState = useCallback(() => {
    if (hasAccess === null) {
      setHasAccess(false);
      setAuthorizedWallet(null);
    }
  }, [hasAccess]);

  const grantAccess = useCallback((walletAddress: string) => {
    setHasAccess(true);
    setAuthorizedWallet(walletAddress);
  }, []);

  const clearAccess = useCallback(() => {
    setHasAccess(false);
    setAuthorizedWallet(null);
    setShowSuccessDialog(false);
  }, []);

  const revokeAccess = useCallback(async () => {
    if (authorizedWallet) {
      try {
        await revokeWalletAccessMutation.mutateAsync({ walletAddress: authorizedWallet });
        toast.success('Access revoked successfully');
      } catch (error) {
        toast.error('Failed to revoke access');
      }
    }
    setHasAccess(false);
    setAuthorizedWallet(null);
    setShowSuccessDialog(false);
  }, [authorizedWallet, revokeWalletAccessMutation]);

  const validateAccessCode = useCallback(
    async (code: string, walletAddress: string) => {
      setIsValidating(true);

      try {
        await validateCodeMutation.mutateAsync({
          code: code.trim().toUpperCase(),
          userIdentifier: walletAddress,
        });

        try {
          await autoFaucetMutation.mutateAsync({
            recipient: walletAddress,
          });
          toast.success('Access granted! 100,000 USDC has been sent to your wallet.');

          // Dispatch single event to trigger balance refresh across the app
          window.dispatchEvent(new Event('token-received'));
        } catch (faucetError) {
          toast.warning(
            'Access granted! However, there was an issue sending USDC. Please contact support.',
          );
        }

        setHasAccess(true);
        setAuthorizedWallet(walletAddress);
        setShowSuccessDialog(true);
        return true;
        // eslint-disable-next-line
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to validate access code';
        toast.error(errorMessage);
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [validateCodeMutation, autoFaucetMutation],
  );

  const isWalletAuthorized = useCallback(
    (walletAddress: string) => {
      const isAuthorized = authorizedWallet === walletAddress && hasAccess === true;
      return isAuthorized;
    },
    [authorizedWallet, hasAccess],
  );

  const closeSuccessDialog = useCallback(() => {
    setShowSuccessDialog(false);
  }, []);

  return {
    hasAccess,
    authorizedWallet,
    isValidating,
    showSuccessDialog,
    grantAccess,
    revokeAccess,
    isWalletAuthorized,
    validateAccessCode,
    initializeAccessState,
    closeSuccessDialog,
    isLoading: revokeWalletAccessMutation.isLoading || autoFaucetMutation.isLoading,
    clearAccess,
  };
}

export function useWalletAuthorization(walletAddress: string | undefined) {
  const { data, isLoading, error, refetch } = trpc.accessCode.checkWalletAccess.useQuery(
    { walletAddress: walletAddress?.toLowerCase() || '' },
    {
      enabled: !!walletAddress && walletAddress.length > 0,
      retry: false,
    },
  );

  return {
    walletHasAccess: data?.hasAccess || false,
    isLoading: !!walletAddress && isLoading,
    error,
    refetch,
    // eslint-disable-next-line
    authorizedAt: data?.hasAccess ? (data as any).authorizedAt : undefined,
    // eslint-disable-next-line
    accessCodeUsed: data?.hasAccess ? (data as any).accessCodeUsed : undefined,
    // eslint-disable-next-line
    lastLoginAt: data?.hasAccess ? (data as any).lastLoginAt : undefined,
  };
}
