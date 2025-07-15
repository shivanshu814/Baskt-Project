export interface AccessCodeEntryProps {
  onSuccess: (walletAddress: string) => void;
}

export interface AccessCodeSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
}
export interface AccessCodeSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface TextLinkProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  linkText: string;
  onClick: () => void;
  color: string;
}
