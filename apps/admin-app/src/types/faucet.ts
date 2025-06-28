import { Role } from './roles';

export interface FaucetDialogProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  userAddress: string;
  onFaucetComplete: () => void;
}

export interface FaucetFormData {
  amount: string;
}

export interface UserFaucetProps {
  userAddress: string;
  onFaucet: (userAddress: string) => void;
}

export interface UsersManagementProps {
  showModal: boolean;
  setShowModal: (showModal: boolean) => void;
}
export interface UsersTableProps {
  roles: Role[];
  isLoading: boolean;
  onCopyAddress: (address: string) => void;
  onFaucet: (userAddress: string) => void;
}
