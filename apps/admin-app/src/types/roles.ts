export interface Role {
  account: string;
  role: string;
}

export interface Permission {
  id: string;
  name: string;
  key: string;
  description: string;
}

export interface RolesManagementProps {
  showModal: boolean;
  setShowModal: (showModal: boolean) => void;
}

export interface AddRoleDialogProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  onRoleAdded: () => void;
  isOwner: boolean;
}

export interface RoleActionsProps {
  account: string;
  role: string;
  isOwner: boolean;
  onCopyAddress: (address: string) => void;
  onRemoveRole: (account: string, role: string) => void;
}

export interface RoleTableProps {
  roles: Role[];
  isLoading: boolean;
  isOwner: boolean;
  copiedAddress: string | null;
  onCopyAddress: (address: string) => void;
  onRemoveRole: (account: string, role: string) => void;
}
