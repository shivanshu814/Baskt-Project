import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { TruncatedTextProps } from '../../types/shared';

export function TruncatedText({
  text,
  startChars = 4,
  endChars = 4,
  className,
  copyOnClick = false,
}: TruncatedTextProps) {
  const [copied, setCopied] = useState(false);

  if (!text) return null;

  if (text.length <= startChars + endChars + 3) {
    return <span className={className}>{text}</span>;
  }

  const truncatedText = `${text.slice(0, startChars)}...${text.slice(-endChars)}`;

  const copyToClipboard = () => {
    if (copyOnClick) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!copyOnClick) {
    return <span className={className}>{truncatedText}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip open={copied}>
        <TooltipTrigger asChild>
          <span
            onClick={copyToClipboard}
            className={cn(
              'cursor-pointer transition-all',
              'hover:underline hover:text-primary',
              className,
            )}
          >
            {truncatedText}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copied!</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
