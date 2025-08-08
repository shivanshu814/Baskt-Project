export interface StatusBannerProps {
  status?: 'operational' | 'warning' | 'error';
  statusText?: string;
  showSocialLinks?: boolean;
}

export type StatusType = 'operational' | 'warning' | 'error';
