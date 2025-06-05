import { ReactNode, ComponentType } from 'react';
import { TabId } from '../constants/tabs';
import { Baskt } from './baskt';
import { Asset } from './assets';
import { Role, Permission } from './roles';

export interface AdminTabsProps {
  activeTab: TabId;
  handleTabChange: (tab: string) => void;
  showRoleModal: boolean;
  setShowRoleModal: (show: boolean) => void;
  isOwner: boolean;
  hasPermission: (permissionKey: string) => boolean;
  renderActionButton: (tabId: TabId) => ReactNode;
}

export interface TabConfig {
  id: TabId;
  label: string;
  component: ComponentType<any>; // eslint-disable-line
  actionButton?: ComponentType<any>; // eslint-disable-line
  requiresOwner?: boolean;
  requiresPermission?: boolean;
  permissionKey?: string;
}

export interface TabProps {
  isOwner: boolean;
  hasPermission: boolean;
  showModal?: boolean;
  setShowModal?: (show: boolean) => void;
}

export interface TabContentProps {
  isOwner: boolean;
  hasPermission: boolean;
  showModal?: boolean;
  setShowModal?: (show: boolean) => void;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorResponse {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AdminState {
  roles: Role[];
  assets: Asset[];
  baskts: Baskt[];
  users: User[];
  permissions: Permission[];
  loading: boolean;
  error: string | null;
}

export interface RootState {
  auth: AuthState;
  admin: AdminState;
}

export interface AdminNavbarProps {
  setSidebarOpen: (open: boolean) => void;
  className?: string;
}
