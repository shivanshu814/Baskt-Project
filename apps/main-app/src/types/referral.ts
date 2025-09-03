export interface UseReferralCodeReturn {
  referralCode: string | null;
  isLoading: boolean;
  error: string | null;
  generateCode: () => Promise<void>;
  isGenerating: boolean;
}

export interface UseTrackReferralReturn {
  trackReferral: (referralCode: string, userAddress: string) => Promise<void>;
  error: string | null;
  success: boolean;
}

export interface UseUserReferralDataReturn {
  data: any | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface SendReferralEmailParams {
  inviteeEmail: string;
}
