import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useToast } from '../../common/use-toast';
import { useBasktClient } from '@baskt/ui';
import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { BasktFormData } from './useCreateBasktForm';
import { OnchainAssetConfig } from '@baskt/types';

export type TransactionStatus = 'waiting' | 'confirmed' | 'processing' | 'success' | 'failed';

export const useBasktCreation = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { authenticated, ready, login } = usePrivy();
  const { client: basktClient, wallet } = useBasktClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('waiting');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBaskt = async (basktData: BasktFormData) => {
    if (!wallet) return;
    try {
      setIsTransactionModalOpen(true);
      setTransactionStatus('waiting');

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

      setTransactionStatus('success');
      router.push(`/baskts/${basktId}`);
    } catch (error) {
      setTransactionStatus('failed');
      toast({
        title: 'Warning',
        description: 'Failed to create baskt',
        variant: 'destructive',
      });
    }
  };

  const handleRetry = () => {
    setTransactionStatus('waiting');
  };

  return {
    isSubmitting,
    setIsSubmitting,
    transactionStatus,
    setTransactionStatus,
    isTransactionModalOpen,
    setIsTransactionModalOpen,
    error,
    setError,
    createBaskt,
    handleRetry,
    authenticated,
    ready,
    login,
  };
};
