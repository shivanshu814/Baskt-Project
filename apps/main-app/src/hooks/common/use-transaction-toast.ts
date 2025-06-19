import { useState, useCallback } from 'react';
import { toast } from './use-toast';
import { TransactionStatus, TransactionToastConfig } from '../../types/baskt';
import { getSolscanAddressUrl } from '@baskt/ui';

export const transactionToastConfigs = {
  basktCreation: {
    waiting: {
      title: 'Creating Baskt',
      description: 'Please sign the transaction in your wallet to create your Baskt.',
    },
    confirmed: {
      title: 'Transaction Confirmed',
      description: 'Your transaction has been confirmed on-chain. Now saving to our database...',
    },
    processing: {
      title: 'Processing Baskt',
      description: 'Finalizing your Baskt and writing to the database...',
    },
    success: {
      title: 'Baskt Created Successfully!',
      description: 'Your Baskt is now live and ready to explore.',
    },
    failed: {
      title: 'Failed to Create Baskt',
      description: 'Something went wrong while creating your Baskt. Please try again.',
    },
  },
} as const;

export const getTransactionToastConfig = (
  action: keyof typeof transactionToastConfigs,
): TransactionToastConfig => {
  return transactionToastConfigs[action];
};

export const createTransactionToastConfig = (
  action: string,
  customConfig: Partial<TransactionToastConfig>,
): TransactionToastConfig => {
  const baseConfig = transactionToastConfigs.basktCreation;
  return {
    ...baseConfig,
    ...customConfig,
  };
};

export const useTransactionToast = () => {
  const [currentToastId, setCurrentToastId] = useState<string | null>(null);

  const showTransactionToast = useCallback(
    (
      status: TransactionStatus,
      config?: TransactionToastConfig,
      signature?: string,
      error?: string,
      onRetry?: () => void,
    ) => {
      const getStatusText = (status: TransactionStatus) => {
        switch (status) {
          case 'waiting':
            return config?.waiting?.title || 'Waiting for Signature';
          case 'confirmed':
            return config?.confirmed?.title || 'On-Chain Confirmed';
          case 'processing':
            return config?.processing?.title || 'Processing';
          case 'success':
            return config?.success?.title || 'Success!';
          case 'failed':
            return config?.failed?.title || 'Something Went Wrong';
        }
      };

      const getStatusDescription = (status: TransactionStatus) => {
        let baseDescription = '';
        switch (status) {
          case 'waiting':
            baseDescription =
              config?.waiting?.description ||
              'Please sign the transaction in your wallet to continue.';
            break;
          case 'confirmed':
            baseDescription =
              config?.confirmed?.description || 'Signature accepted—now saving on our side.';
            break;
          case 'processing':
            baseDescription =
              config?.processing?.description || 'Finalizing and writing to the database…';
            break;
          case 'success':
            baseDescription =
              config?.success?.description || 'Your Baskt is live—go explore it now.';
            break;
          case 'failed':
            baseDescription =
              config?.failed?.description || 'Your signature went through, but saving failed.';
            break;
        }

        if (status === 'success' && signature) {
          const explorerUrl = getSolscanAddressUrl(signature);
          baseDescription += `\n\n🔗 View on Explorer: ${explorerUrl}`;
        }

        if (status === 'failed' && error) {
          baseDescription += `\n\n❌ Error: ${error}`;
        }

        return baseDescription;
      };

      const toastResult = toast({
        title: getStatusText(status),
        description: getStatusDescription(status),
        duration: status === 'success' || status === 'failed' ? 5000 : Infinity,
        variant: status === 'failed' ? 'destructive' : 'default',
      });

      setCurrentToastId(toastResult.id);
      return toastResult;
    },
    [currentToastId],
  );

  const updateTransactionToast = useCallback(
    (
      status: TransactionStatus,
      config?: TransactionToastConfig,
      signature?: string,
      error?: string,
      onRetry?: () => void,
    ) => {
      if (!currentToastId) return;

      const getStatusText = (status: TransactionStatus) => {
        switch (status) {
          case 'waiting':
            return config?.waiting?.title || 'Waiting for Signature';
          case 'confirmed':
            return config?.confirmed?.title || 'On-Chain Confirmed';
          case 'processing':
            return config?.processing?.title || 'Processing';
          case 'success':
            return config?.success?.title || 'Success!';
          case 'failed':
            return config?.failed?.title || 'Something Went Wrong';
        }
      };

      const getStatusDescription = (status: TransactionStatus) => {
        let baseDescription = '';
        switch (status) {
          case 'waiting':
            baseDescription =
              config?.waiting?.description ||
              'Please sign the transaction in your wallet to continue.';
            break;
          case 'confirmed':
            baseDescription =
              config?.confirmed?.description || 'Signature accepted—now saving on our side.';
            break;
          case 'processing':
            baseDescription =
              config?.processing?.description || 'Finalizing and writing to the database…';
            break;
          case 'success':
            baseDescription =
              config?.success?.description || 'Your Baskt is live—go explore it now.';
            break;
          case 'failed':
            baseDescription =
              config?.failed?.description || 'Your signature went through, but saving failed.';
            break;
        }

        if (status === 'success' && signature) {
          const explorerUrl = getSolscanAddressUrl(signature);
          baseDescription += `\n\n🔗 View on Explorer: ${explorerUrl}`;
        }

        if (status === 'failed' && error) {
          baseDescription += `\n\n❌ Error: ${error}`;
        }

        return baseDescription;
      };

      showTransactionToast(status, config, signature, error, onRetry);
    },
    [currentToastId, showTransactionToast],
  );

  const dismissTransactionToast = useCallback(() => {
    if (currentToastId) {
      setCurrentToastId(null);
    }
  }, [currentToastId]);

  return {
    showTransactionToast,
    updateTransactionToast,
    dismissTransactionToast,
    currentToastId,
  };
};
