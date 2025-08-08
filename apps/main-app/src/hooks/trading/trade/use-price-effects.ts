import { useEffect, useRef, useState } from 'react';

export const usePriceEffects = (currentPrice: number | null) => {
  const [priceColor, setPriceColor] = useState<string>('text-foreground');
  const prevPriceRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevPriceRef.current !== null && currentPrice) {
      const currentPriceNum = currentPrice;
      if (currentPriceNum > prevPriceRef.current) {
        setPriceColor('text-green-500');
      } else if (currentPriceNum < prevPriceRef.current) {
        setPriceColor('text-red-500');
      } else {
        setPriceColor('text-foreground');
      }
    }
    if (currentPrice) {
      prevPriceRef.current = currentPrice;
    }
  }, [currentPrice]);

  return priceColor;
};
