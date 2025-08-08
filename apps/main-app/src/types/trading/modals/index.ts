import { ReactNode } from 'react';

export interface ModalState {
  isAddCollateralModalOpen: boolean;
  setIsAddCollateralModalOpen: (open: boolean) => void;
  isCancelOrderModalOpen: boolean;
  setIsCancelOrderModalOpen: (open: boolean) => void;
  isClosePositionModalOpen: boolean;
  setIsClosePositionModalOpen: (open: boolean) => void;
  selectedPositionForModal: any;
  setSelectedPositionForModal: (position: any) => void;
  selectedOrderForModal: any;
  setSelectedOrderForModal: (order: any) => void;
  openAddCollateralModal: (position: any) => void;
  openClosePositionModal: (position: any) => void;
  openCancelOrderModal: (order: any) => void;
  closeAllModals: () => void;
}

export interface AddCollateralModalProps {
  isOpen: boolean;
  position: any;
}

export interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onCancelOrder: (order: any) => void;
}

export interface ClosePositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: any;
  onClosePosition: (position: any, amount: string, type: 'partial' | 'full') => void;
}

export interface ModalBackdropProps {
  children: ReactNode;
  onClose?: () => void;
}

export interface CongratulationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  basktName: string;
  basktDescription?: string;
  assets: Array<{
    ticker: string;
    weight: number;
    logo?: string;
  }>;
  basktId?: string;
}
