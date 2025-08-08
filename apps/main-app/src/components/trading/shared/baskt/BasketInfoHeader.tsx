'use client';

import { useBasketInfoHeader } from '../../../../hooks/shared/use-basket-info-header';
import { BasketInfoHeaderProps } from '../../../../types/baskt/components/header';
import { BasketInfoHeaderDesktop } from '../../desktop/baskt/BasketInfoHeaderDesktop';
import { BasketInfoHeaderMobile } from '../../mobile/baskt/BasketInfoHeaderMobile';

export function BasketInfoHeader(props: BasketInfoHeaderProps) {
  const { shouldShowMobile, shouldShowDesktop, baskt, currentPrice, priceColor, onClose } =
    useBasketInfoHeader(props);

  if (shouldShowMobile) {
    return <BasketInfoHeaderMobile baskt={baskt} onClose={onClose} />;
  }

  if (shouldShowDesktop) {
    return (
      <BasketInfoHeaderDesktop baskt={baskt} currentPrice={currentPrice} priceColor={priceColor} />
    );
  }

  return null;
}
