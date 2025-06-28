import { useState } from 'react';
import { toast } from 'sonner';
import { FaucetFormData } from '../types/faucet';
import { trpc } from '../utils/trpc';

export function useFaucet() {
  const [isLoading, setIsLoading] = useState(false);
  const faucetMutation = trpc.faucet.faucet.useMutation();
  const autoFaucetMutation = trpc.faucet.autoFaucet.useMutation();

  const sendFaucet = async (recipientAddress: string, formData: FaucetFormData) => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      const amount = parseFloat(formData.amount);

      const result = await faucetMutation.mutateAsync({
        recipient: recipientAddress,
        amount: amount,
      });
      if (result.success) {
        toast.success(`Successfully sent ${amount} USDC to ${recipientAddress.slice(0, 8)}...`);
      } else {
        const errorMessage = 'error' in result ? result.error : 'Faucet failed';
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send faucet';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendAutoFaucet = async (recipientAddress: string) => {
    setIsLoading(true);
    try {
      const result = await autoFaucetMutation.mutateAsync({
        recipient: recipientAddress,
      });
      if (result.success) {
        toast.success(`Successfully sent 100,000 USDC to ${recipientAddress.slice(0, 8)}...`);
        return result;
      } else {
        const errorMessage = 'error' in result ? result.error : 'Auto faucet failed';
        throw new Error(errorMessage);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send auto faucet';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendFaucet,
    sendAutoFaucet,
    isLoading: isLoading || faucetMutation.isLoading || autoFaucetMutation.isLoading,
  };
}
