'use client';

import { ExternalLink } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { getSolscanAddressUrl, getSolscanTxUrl } from '@baskt/ui';

interface TransactionToastProps {
  title: string;
  description: string;
  txSignature?: string;
  address?: string;
  addressLabel?: string;
}

/**
 * Displays a transaction toast with links to Solscan
 */
export function showTransactionToast({
  description,
  txSignature,
  address,
  addressLabel = 'View Address',
}: TransactionToastProps) {
  const txUrl = txSignature ? getSolscanTxUrl(txSignature) : undefined;
  const addressUrl = address ? getSolscanAddressUrl(address) : undefined;

  toast({
    title: description,
    description: (
      <div className="flex flex-col space-y-1">
        {addressUrl && (
          <a
            href={addressUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline flex items-center gap-1 text-sm"
          >
            {addressLabel} <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {txUrl && (
          <a
            href={txUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline flex items-center gap-1 text-sm"
          >
            View Transaction <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    ),
    duration: 5000,
    className: 'bg-[#010b1d] text-white border border-white/10',
  });
}
