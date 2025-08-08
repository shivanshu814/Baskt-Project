import { BasketInfoHeaderProps } from '../../types/baskt/components/header';

export const useBasketInfoHeader = ({
  baskt,
  currentPrice,
  priceColor,
  isMobile = false,
  onClose,
}: BasketInfoHeaderProps) => {
  const shouldShowMobile = isMobile;
  const shouldShowDesktop = !isMobile;

  return {
    shouldShowMobile,
    shouldShowDesktop,
    baskt,
    currentPrice,
    priceColor,
    onClose,
  };
};
