import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useTransactionToast, getTransactionToastConfig } from '../../common/use-transaction-toast';
import { useBasktClient } from '@baskt/ui';
import { BasktFormData } from '../create/useCreateBasktForm';
import { parseSolanaError } from '../../../utils/common/error-handling';

export type TransactionStatus = 'waiting' | 'confirmed' | 'processing' | 'success' | 'failed';

export const useBasktEdit = () => {
  const router = useRouter();
  const { showTransactionToast } = useTransactionToast();
  const { authenticated, ready, login } = usePrivy();
  const { client: basktClient, wallet } = useBasktClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('waiting');
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  // eslint-disable-next-line
  const updateBaskt = async (basktId: string, basktData: BasktFormData) => {
    if (!wallet) return;
    try {
      setIsSubmitting(true);
      setTransactionStatus('waiting');

      const config = getTransactionToastConfig('basktCreation');

      showTransactionToast('waiting', config);

      setTransactionStatus('success');
      showTransactionToast('success', config);

      router.push(`/baskts/${basktId}`);
    } catch (error) {
      setTransactionStatus('failed');
      const parsedError = parseSolanaError(error);
      setError(parsedError.message);

      const config = getTransactionToastConfig('basktCreation');
      showTransactionToast('failed', config, signature || undefined, parsedError.message);
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
    updateBaskt,
    handleRetry,
    authenticated,
    ready,
    login,
    signature,
    client: basktClient,
  };
};
