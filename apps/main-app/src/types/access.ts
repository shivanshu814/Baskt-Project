export interface AccessCodeEntryProps {
  onSuccess: (walletAddress: string) => void;
}

export interface AccessCodeSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
}
