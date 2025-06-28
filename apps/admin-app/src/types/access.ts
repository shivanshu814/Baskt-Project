export interface DeleteCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    code: string;
    isLoading?: boolean;
  }