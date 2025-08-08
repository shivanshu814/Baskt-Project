import { useModalState } from '../../../../hooks/trading/modals/use-modal-state';
import { AddCollateralModal } from './AddCollateralModal';
import { CancelOrderModal } from './CancelOrderModal';
import { ClosePositionModal } from './ClosePositionModal';

export function TradingModals() {
  const {
    isAddCollateralModalOpen,
    isCancelOrderModalOpen,
    setIsCancelOrderModalOpen,
    isClosePositionModalOpen,
    setIsClosePositionModalOpen,
    selectedPositionForModal,
    selectedOrderForModal,
  } = useModalState();

  return (
    <>
      <AddCollateralModal isOpen={isAddCollateralModalOpen} position={selectedPositionForModal} />

      <CancelOrderModal
        isOpen={isCancelOrderModalOpen}
        onClose={() => setIsCancelOrderModalOpen(false)}
        order={selectedOrderForModal}
        onCancelOrder={() => {}}
      />

      <ClosePositionModal
        isOpen={isClosePositionModalOpen}
        onClose={() => setIsClosePositionModalOpen(false)}
        position={selectedPositionForModal}
        onClosePosition={() => {}}
      />
    </>
  );
}
