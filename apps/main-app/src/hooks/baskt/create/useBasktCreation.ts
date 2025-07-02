import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useTransactionToast, getTransactionToastConfig } from '../../common/use-transaction-toast';
import { useBasktClient } from '@baskt/ui';
import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { BasktFormData } from './useCreateBasktForm';
import { OnchainAssetConfig } from '@baskt/types';
import { getBasktCreationErrorMessage } from '../../../utils/error-handling';

export type TransactionStatus = 'waiting' | 'confirmed' | 'processing' | 'success' | 'failed';

export const useBasktCreation = () => {
  const router = useRouter();
  const { showTransactionToast } = useTransactionToast();
  const { authenticated, ready, login } = usePrivy();
  const { client: basktClient, wallet } = useBasktClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('waiting');
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const createBaskt = async (basktData: BasktFormData) => {
    if (!wallet) return;
    try {
      setIsSubmitting(true);
      setTransactionStatus('waiting');

      const config = getTransactionToastConfig('basktCreation');

      showTransactionToast('waiting', config);

      // Check if baskt name already exists
      const nameExists = await basktClient?.doesBasktNameExist(basktData.name);
      if (nameExists) {
        setTransactionStatus('failed');
        setError('A baskt with this name already exists. Please choose a different name.');
        showTransactionToast(
          'failed',
          config,
          undefined,
          'A baskt with this name already exists. Please choose a different name.',
        );
        return;
      }

      const result = await basktClient?.createBaskt(
        basktData.name,
        basktData.assets.map(
          (asset) =>
            ({
              assetId: new PublicKey(asset.assetAddress),
              baselinePrice: new anchor.BN(0),
              direction: asset.direction,
              weight: new anchor.BN((asset.weight / 100) * 10_000),
            } as OnchainAssetConfig),
        ),
        basktData.isPublic,
      );

      if (!result) {
        throw new Error('Failed to create baskt');
      }

      const { basktId, txSignature } = result;

      if (!basktId || !txSignature) {
        throw new Error('Failed to create baskt');
      }

      setSignature(txSignature);
      setTransactionStatus('success');
      showTransactionToast('success', config, txSignature);
      router.push(`/baskts/${encodeURIComponent(basktData.name)}`);
    } catch (error) {
      setTransactionStatus('failed');
      const errorMessage = getBasktCreationErrorMessage(error);
      setError(errorMessage);

      const config = getTransactionToastConfig('basktCreation');
      showTransactionToast('failed', config, signature || undefined, errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setTransactionStatus('waiting');
    setSignature(null);
    setError(null);
  };

  return {
    isSubmitting,
    setIsSubmitting,
    transactionStatus,
    setTransactionStatus,
    error,
    setError,
    createBaskt,
    handleRetry,
    authenticated,
    ready,
    login,
    signature,
  };
};
