'use client';

import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';
import { AssetLogoProps } from '../../../types/asset';

export const AssetLogo = ({ ticker, logo, size = 'md' }: AssetLogoProps) => {
  const sizeClasses = {
    sm: 'h-5 w-5 text-xs',
    md: 'h-6 w-6 text-sm',
    lg: 'h-12 w-12 text-xl',
  };

  const [imageError, setImageError] = useState(false);
  const fallbackContent = useMemo(() => ticker.substring(0, 2).toUpperCase(), [ticker]);

  const handleImageError = useCallback(() => setImageError(true), []);

  if (logo && logo.startsWith('http') && !imageError) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-muted/30 flex items-center justify-center border border-border/20 overflow-hidden`}
      >
        <Image
          src={logo}
          alt={ticker}
          width={32}
          height={32}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-muted/30 flex items-center justify-center text-lg font-bold border border-border/20`}
    >
      {fallbackContent}
    </div>
  );
};
