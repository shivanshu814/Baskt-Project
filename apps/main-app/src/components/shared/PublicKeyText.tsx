import React from 'react';
import { cn } from '../../lib/utils';
import { TruncatedText } from './TruncatedText';
import { PublicKeyTextProps } from '../../types/shared';

export function PublicKeyText({ publicKey, className }: PublicKeyTextProps) {
  if (!publicKey) return null;

  return (
    <TruncatedText
      text={publicKey}
      startChars={4}
      endChars={4}
      copyOnClick={true}
      className={cn('font-mono', className)}
    />
  );
}
