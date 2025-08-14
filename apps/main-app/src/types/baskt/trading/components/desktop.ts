import { BasktInfo } from '@baskt/types';

export interface DesktopHeaderProps {
  baskt: BasktInfo;
}

export interface BasketListItemProps {
  baskt: BasktInfo;
  isCurrentBaskt?: boolean;
  onClick?: () => void;
  volume?: number;
  openInterest?: number;
  volumeLoading?: boolean;
  oiLoading?: boolean;
}
