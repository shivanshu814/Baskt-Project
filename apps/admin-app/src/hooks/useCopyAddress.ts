import { useState } from 'react';
import { toast } from 'sonner';

export function useCopyAddress() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  return {
    copiedAddress,
    handleCopyAddress,
  };
}
