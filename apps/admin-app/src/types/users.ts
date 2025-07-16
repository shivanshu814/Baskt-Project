export interface CombinedUser {
  account: string;
  role: string;
  source: 'roles' | 'access_code';
  accessCode?: string;
}

export interface AccessCodeUser {
  address: string;
  codeUsed: string;
  usedAt?: string;
}
