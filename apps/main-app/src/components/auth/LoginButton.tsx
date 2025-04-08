'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@baskt/ui';
import { Wallet } from 'lucide-react';

export function LoginButton() {
  const { login } = usePrivy();

  return (
    <Button
      onClick={login}
      variant="primary"
      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium flex items-center justify-center gap-3 h-14 rounded-2xl text-lg transition-all duration-200 ease-out"
    >
      <Wallet className="w-6 h-6" />
      Connect Wallet
    </Button>
  );
}
