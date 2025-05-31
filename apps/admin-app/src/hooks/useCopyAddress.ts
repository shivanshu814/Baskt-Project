import { useState } from 'react';

export function useCopyAddress() {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error('failed to copy address:', error);
    }
  };

  return {
    copiedAddress,
    handleCopyAddress,
  };
}
