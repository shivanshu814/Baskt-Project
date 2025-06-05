import { useState } from 'react';
import { useToast } from './use-toast';

export function useCopyAddress() {
  const { toast } = useToast();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy address',
        variant: 'destructive',
      });
    }
  };

  return {
    copiedAddress,
    handleCopyAddress,
  };
}
