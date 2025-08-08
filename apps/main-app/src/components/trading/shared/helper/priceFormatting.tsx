import { NumberFormat } from '@baskt/ui';
import React from 'react';

export const formatBasketPrice = (currentPrice: number, priceColor: string) => {
  return (
    <span className={`text-lg font-bold sm:text-xl ml-2 ${priceColor}`}>
      <NumberFormat value={currentPrice} isPrice={true} showCurrency={true} />
    </span>
  );
};
