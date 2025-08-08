import { BasktInfo } from '@baskt/types';

export interface BasketInfoHeaderProps {
  baskt: BasktInfo;
  currentPrice: number;
  priceColor: string;
  isMobile?: boolean;
  onClose?: () => void;
}
