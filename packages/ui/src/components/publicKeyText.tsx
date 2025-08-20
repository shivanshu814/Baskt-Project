'use client';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export const PublicKeyText = ({
  publicKey,
  isCopy = false,
  noFormat = false,
}: {
  publicKey: string | number | undefined | null;
  isCopy?: boolean;
  noFormat?: boolean;
}) => {
  const [copied, setCopied] = useState(false);

  // Convert publicKey to string and handle edge cases
  const publicKeyString = publicKey?.toString() || '';

  const handleCopy = () => {
    if (publicKeyString) {
      navigator.clipboard.writeText(publicKeyString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayText = noFormat
    ? publicKeyString
    : publicKeyString.length > 10
    ? `${publicKeyString.slice(0, 5)}...${publicKeyString.slice(-5)}`
    : publicKeyString;

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm">{displayText || 'N/A'}</span>
      {isCopy && publicKeyString && (
        <button
          onClick={handleCopy}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          )}
        </button>
      )}
    </div>
  );
};
