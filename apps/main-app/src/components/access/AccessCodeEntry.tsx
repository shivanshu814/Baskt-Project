'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@baskt/ui';
import { Key, Check, X, Wallet } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccessCode, useWalletAuthorization } from '../../hooks/useAccessCode';
import { toast } from 'sonner';
import { AccessCodeEntryProps } from '../../types/access';
import { AccessCodeSuccessDialog } from './AccessCodeSuccessDialog';
import { useUser } from '@baskt/ui';

export function AccessCodeEntry({ onSuccess }: AccessCodeEntryProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { userAddress, isAuthenticated, wallet } = useUser();
  const { login, logout } = usePrivy();


  const { isValidating, validateAccessCode, showSuccessDialog, closeSuccessDialog } =
    useAccessCode();
  const { walletHasAccess } = useWalletAuthorization(userAddress || undefined);

  useEffect(() => {
    if (walletHasAccess && userAddress) {
      toast.success('Welcome back! You are already authorized.');
      setTimeout(() => {
        if (userAddress) {
          onSuccess(userAddress);
        }
      }, 1500);
    }
  }, [walletHasAccess, userAddress, onSuccess]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!code.trim()) return;

      if (!isAuthenticated || !userAddress) {
        toast.error('Please connect your wallet first to use access code');
        setError('Please connect your wallet first to use access code');
        return;
      }

      setError(null);
      await validateAccessCode(code, userAddress);
    },
    [code, isAuthenticated, userAddress, validateAccessCode, onSuccess],
  );

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(value);
    setError(null);
  }, []);

  const handleConnectWallet = useCallback(() => {
    login();
  }, [login]);

  const handleDisconnectWallet = useCallback(async () => {
    await logout();
  }, [logout]);

  if (walletHasAccess && userAddress) {
    return (
      <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px] px-4 sm:px-6">
        <div className="text-center space-y-4 sm:space-y-6 w-full max-w-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Check className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Access Granted!</h2>
            <p className="text-white/60 text-base sm:text-lg">Welcome to Baskt Platform</p>
            <p className="text-white/40 text-xs sm:text-sm">Redirecting to dashboard...</p>
          </div>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-green-400"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px] px-4 sm:px-6 pt-8 sm:pt-16">
        <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6">
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
              <Key className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Enter Access Code</h2>
              <p className="text-white/60 mt-1 sm:mt-2 text-sm sm:text-base">
                Please enter your unique access code to continue
              </p>
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                <span className="text-yellow-400 text-xs sm:text-sm">Wallet not connected</span>
              </div>
              <p className="text-white/60 text-xs sm:text-sm mt-1">
                Please connect your wallet first to use the access code
              </p>
              <Button
                onClick={handleConnectWallet}
                className="w-full mt-2 sm:mt-3"
                variant="outline"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span className="text-green-400 text-xs sm:text-sm">Wallet connected</span>
              </div>
              <p className="text-white/60 text-xs sm:text-sm mt-1 font-mono break-all">
                {userAddress}
              </p>
              <Button
                onClick={handleDisconnectWallet}
                className="w-full mt-2 sm:mt-3"
                variant="outline"
                size="sm"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Disconnect wallet
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="Enter 8-character code"
                maxLength={8}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-center text-base sm:text-lg font-mono tracking-wider"
                disabled={isValidating || !isAuthenticated}
              />
            </div>

            {error && (
              <div className="flex items-start space-x-2 text-red-400 text-xs sm:text-sm">
                <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span className="break-words">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!code.trim() || code.length !== 8 || isValidating || !isAuthenticated}
            >
              {isValidating ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Validating...
                </div>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </div>
      </div>

      <AccessCodeSuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => {
          closeSuccessDialog();
          if (userAddress) {
            onSuccess(userAddress);
          }
        }}
      />
    </>
  );
}
