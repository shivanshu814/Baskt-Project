'use client';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export const PublicKeyText = ({
    publicKey,
    isCopy = false,
    noFormat = false
}: {
    publicKey: string;
    isCopy?: boolean;
    noFormat?: boolean;
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(publicKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const displayText = noFormat
        ? publicKey
        : `${publicKey.slice(0, 5)}...${publicKey.slice(-5)}`;

    return (
        <div className="flex items-center gap-2">
            <span className="font-mono text-sm">
                {displayText}
            </span>
            {isCopy && (
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