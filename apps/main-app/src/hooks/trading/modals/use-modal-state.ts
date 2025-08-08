import React, { createContext, ReactNode, useContext, useState } from 'react';
import { ModalState } from '../../../types/trading/modals';

const ModalContext = createContext<ModalState | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [isAddCollateralModalOpen, setIsAddCollateralModalOpen] = useState(false);
  const [isCancelOrderModalOpen, setIsCancelOrderModalOpen] = useState(false);
  const [isClosePositionModalOpen, setIsClosePositionModalOpen] = useState(false);
  const [selectedPositionForModal, setSelectedPositionForModal] = useState<any>(null);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<any>(null);

  const openAddCollateralModal = (position: any) => {
    setSelectedPositionForModal(position);
    setIsAddCollateralModalOpen(true);
  };

  const openClosePositionModal = (position: any) => {
    setSelectedPositionForModal(position);
    setIsClosePositionModalOpen(true);
  };

  const openCancelOrderModal = (order: any) => {
    setSelectedOrderForModal(order);
    setIsCancelOrderModalOpen(true);
  };

  const closeAllModals = () => {
    setIsAddCollateralModalOpen(false);
    setIsCancelOrderModalOpen(false);
    setIsClosePositionModalOpen(false);
    setSelectedPositionForModal(null);
    setSelectedOrderForModal(null);
  };

  const value: ModalState = {
    isAddCollateralModalOpen,
    setIsAddCollateralModalOpen,
    isCancelOrderModalOpen,
    setIsCancelOrderModalOpen,
    isClosePositionModalOpen,
    setIsClosePositionModalOpen,
    selectedPositionForModal,
    setSelectedPositionForModal,
    selectedOrderForModal,
    setSelectedOrderForModal,
    openAddCollateralModal,
    openClosePositionModal,
    openCancelOrderModal,
    closeAllModals,
  };

  return React.createElement(ModalContext.Provider, { value }, children);
};

export const useModalState = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModalState must be used within a ModalProvider');
  }
  return context;
};
