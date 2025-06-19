'use client';

import { CheckCircle2, Loader2, Info, ExternalLink, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSolscanAddressUrl } from '@baskt/ui';
import { TransactionStatus, TransactionToastProps } from '../../types/baskt';

const getStatusConfig = (status: TransactionStatus) => {
    switch (status) {
        case 'waiting':
            return {
                icon: Loader2,
                color: '#4F46E5',
                title: 'Waiting for Signature',
                description: 'Please sign the transaction in your wallet to continue.',
            };
        case 'confirmed':
            return {
                icon: CheckCircle2,
                color: '#10B981',
                title: 'On-Chain Confirmed',
                description: 'Signature accepted—now saving on our side.',
            };
        case 'processing':
            return {
                icon: Loader2,
                color: '#FBBF24',
                title: 'Processing',
                description: 'Finalizing and writing to the database…',
            };
        case 'success':
            return {
                icon: CheckCircle2,
                color: '#10B981',
                title: 'Success!',
                description: 'Your Baskt is live—go explore it now.',
            };
        case 'failed':
            return {
                icon: Info,
                color: '#EF4444',
                title: 'Something Went Wrong',
                description: 'Your signature went through, but saving failed.',
            };
    }
};

export const TransactionToast = ({
    status,
    title: customTitle,
    description: customDescription,
    signature,
    error,
    onRetry,
    onClose,
}: TransactionToastProps) => {
    const config = getStatusConfig(status);
    if (!config) return null;

    const IconComponent = config.icon;
    const title = customTitle || config.title;
    const description = customDescription || config.description;

    const glowRing = (
        <motion.div
            className="absolute inset-0 rounded-full blur-2xl animate-pulse-slow"
            style={{ backgroundColor: config.color, opacity: 0.2 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
        />
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="bg-[#0D0D1A] text-white rounded-2xl p-4 border border-[#2A2D3A] shadow-2xl min-w-[320px] max-w-[400px]"
        >
            <div className="flex items-start space-x-4">
                <div className="relative flex-shrink-0">
                    {glowRing}
                    <IconComponent
                        className={`relative z-10 h-8 w-8 ${status === 'waiting' || status === 'processing' ? 'animate-spin' : ''}`}
                        style={{ color: config.color }}
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
                    <p className="text-sm text-gray-400 mb-3">{description}</p>

                    {error && (
                        <p className="text-xs text-red-400 mb-3">Details: {error}</p>
                    )}

                    {status === 'success' && signature && (
                        <a
                            href={getSolscanAddressUrl(signature)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                        >
                            View on Explorer <ExternalLink className="w-3 h-3" />
                        </a>
                    )}

                    {status === 'failed' && onRetry && (
                        <button
                            onClick={onRetry}
                            className="mt-2 px-4 py-2 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:from-[#3B3FC1] hover:to-[#5059E0] text-white rounded-full text-sm transition-all duration-200 shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                        >
                            Try Again
                        </button>
                    )}
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}; 