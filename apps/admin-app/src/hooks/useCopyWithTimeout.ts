import { useState } from 'react';

export function useCopyWithTimeout(timeout = 2000) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (value: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), timeout);
  };

  return { copiedKey, handleCopy };
}
