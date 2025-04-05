'use client';

import { Shield } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { LoginButton } from '../../components/auth/LoginButton';

export default function LoginPage() {
  const { authenticated, ready } = usePrivy();

  if (!ready || authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#010b1d] to-[#011330]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin" />
            <div className="absolute inset-0 h-24 w-24 rounded-full border-2 border-white/5 border-r-blue-500 animate-spin-slow" />
          </div>
          <p className="text-lg text-white/60 animate-pulse mt-6">
            {!ready ? 'Initializing...' : 'Please wait...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#010b1d] to-[#011330] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="relative z-10 w-full max-w-md px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/5 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Connect your wallet to access the Baskt admin</p>
        </div>

        <div className="bg-[#011330]/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/5">
          <div className="space-y-4">
            <LoginButton />

            <div className="text-center mt-6">
              <p className="text-sm text-gray-400">
                By connecting your wallet, you agree to our{' '}
                <a href="#" className="text-primary hover:text-primary/80">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary hover:text-primary/80">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
