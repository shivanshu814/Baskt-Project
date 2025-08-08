'use client';

import { BasketInfoHeaderDesktopProps } from '../../../../types/trading/components/desktop';
import { formatBasketPrice } from '../../shared/helper/priceFormatting';

export function BasketInfoHeaderDesktop({
  baskt,
  currentPrice,
  priceColor,
}: BasketInfoHeaderDesktopProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center gap-2">
        <span className="text-lg sm:text-xl font-semibold">Trade {baskt.name}</span>
      </div>
      {formatBasketPrice(currentPrice, priceColor)}
    </div>
  );
}
