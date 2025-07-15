import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useTransactionToast, getTransactionToastConfig } from '../../common/use-transaction-toast';
import { useBasktClient } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { BasktFormData } from './useCreateBasktForm';
import { OnchainAssetConfig } from '@baskt/types';
import {
  checkBasktNameExists,
  checkDuplicateAssetConfig,
} from '../../../utils/baskt/nameValidation';
import { trpc } from '../../../utils/common/trpc';

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

  const { data: existingBasktsData } = trpc.baskt.getAllBaskts.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const createBaskt = async (basktData: BasktFormData) => {
    if (!wallet) return;

    const config = getTransactionToastConfig('basktCreation');

    try {
      setIsSubmitting(true);
      setTransactionStatus('waiting');

      const nameCheck = await checkBasktNameExists(basktData.name, basktClient);
      if (nameCheck.exists) {
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

      if (existingBasktsData?.success && existingBasktsData.data) {
        const duplicateCheck = checkDuplicateAssetConfig(
          basktData.assets.map((asset) => ({
            assetAddress: asset.assetAddress,
            weight: asset.weight,
            direction: asset.direction,
          })),
          existingBasktsData.data
            .filter((baskt: any) => baskt !== null && baskt !== undefined)
            .map((baskt: any) => ({
              name: baskt.name || 'Unknown Baskt',
              assets:
                baskt.assets?.map((asset: any) => ({
                  assetAddress: asset.assetAddress,
                  weight: asset.weight,
                  direction: asset.direction,
                })) || [],
            })),
        );

        if (duplicateCheck.isDuplicate) {
          setTransactionStatus('failed');
          setError(
            `A baskt with the same asset configuration already exists: ${duplicateCheck.duplicateBaskt}. Please modify your asset selection or weights.`,
          );
          showTransactionToast(
            'failed',
            config,
            undefined,
            `A baskt with the same asset configuration already exists: ${duplicateCheck.duplicateBaskt}. Please modify your asset selection or weights.`,
          );
          return;
        }
      }

      showTransactionToast('waiting', config);

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

      const basktName = basktData.name;
      router.push(`/baskts/${encodeURIComponent(basktName)}`);
    } catch (error) {
      setTransactionStatus('failed');
      const errorMessage = error instanceof Error ? error.message : 'Failed to create baskt';
      setError(errorMessage);
      showTransactionToast('failed', config, undefined, errorMessage);
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
    transactionStatus,
    error,
    setError,
    signature,
    createBaskt,
    authenticated,
    ready,
    login,
    client: basktClient,
  };
};
