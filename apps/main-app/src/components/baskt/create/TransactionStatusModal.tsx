'use client';

import { CheckCircle2, Loader2, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { motion } from 'framer-motion';
import { TransactionStatusModalProps } from '../../../types/baskt';

export const TransactionStatusModal = ({
  open,
  onOpenChange,
  onRetry,
  status,
  error,
}: TransactionStatusModalProps) => {
  const glowRing = (colorHex: string) => (
    <motion.div
      className="absolute inset-0 rounded-full blur-2xl animate-pulse-slow"
      style={{ backgroundColor: colorHex, opacity: 0.2 }}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ repeat: Infinity, duration: 2.2 }}
    />
  );

  let title: string;
  let description: React.ReactNode;
  let icon: JSX.Element;

  switch (status) {
    case 'waiting':
      title = 'Waiting for Signature';
      description = 'Please sign the transaction in your wallet to continue.';
      icon = (
        <div className="relative w-16 h-16">
          {glowRing('#4F46E5')}
          <Loader2 className="relative z-10 h-16 w-16 text-[#4F46E5] animate-spin" />
        </div>
      );
      break;

    case 'confirmed':
      title = 'On-Chain Confirmed';
      description = 'Signature accepted—now saving on our side.';
      icon = (
        <div className="relative w-16 h-16">
          {glowRing('#10B981')}
          <CheckCircle2 className="relative z-10 h-16 w-16 text-[#10B981]" />
        </div>
      );
      break;

    case 'processing':
      title = 'Processing';
      description = 'Finalizing and writing to the database…';
      icon = (
        <div className="relative w-16 h-16">
          {glowRing('#FBBF24')}
          <Loader2 className="relative z-10 h-16 w-16 text-[#FBBF24] animate-spin" />
        </div>
      );
      break;

    case 'success':
      title = 'Success!';
      description = 'Your Baskt is live—go explore it now.';
      icon = (
        <div className="relative w-16 h-16">
          {glowRing('#10B981')}
          <CheckCircle2 className="relative z-10 h-16 w-16 text-[#10B981]" />
        </div>
      );
      break;

    case 'failed':
      title = 'Something Went Wrong';
      description = (
        <div className="space-y-1 text-center text-gray-300">
          <p>Your signature went through, but saving failed.</p>
          {error && <p className="text-xs text-red-400">Details: {error}</p>}
        </div>
      );
      icon = (
        <div className="relative w-16 h-16">
          {glowRing('#EF4444')}
          <Info className="relative z-10 h-16 w-16 text-[#EF4444]" />
        </div>
      );
      break;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px] bg-[#0D0D1A] text-white rounded-2xl p-4"
        aria-describedby="transaction-status-description"
      >
        <DialogHeader>
          <DialogTitle>Transaction Status</DialogTitle>
          <DialogDescription id="transaction-status-description">
            {status === 'waiting' && 'Waiting for transaction confirmation...'}
            {status === 'confirmed' && 'Transaction confirmed, processing...'}
            {status === 'processing' && 'Processing your transaction...'}
            {status === 'success' && 'Transaction completed successfully!'}
            {status === 'failed' && 'Transaction failed. Please try again.'}
          </DialogDescription>
        </DialogHeader>
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 p-1 rounded hover:bg-white/10 transition"
        >
          <span className="sr-only">Close</span>
        </button>

        <div className="pt-12 pb-6 px-6 flex flex-col items-center space-y-4">
          {icon}
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          <p className="text-center text-gray-400">{description}</p>
        </div>

        <div className="border-t border-[#2A2D3A]" />

        <div className="py-6 px-6">
          {status === 'failed' && onRetry ? (
            <Button
              onClick={onRetry}
              className={`w-full py-3 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:from-[#3B3FC1] hover:to-[#5059E0] text-white rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] transition`}
            >
              Try Again
            </Button>
          ) : (
            <Button
              onClick={() => onOpenChange(false)}
              className={`w-full py-3 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:from-[#3B3FC1] hover:to-[#5059E0] text-white rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] transition`}
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
