'use client';

import {
  Wallet,
  Shield,
  TrendingUp,
  Info,
  Globe,
  Zap,
  ChevronRight,
  Lock,
  Sparkles,
  Boxes,
} from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { LoginButton } from '../../components/auth/LoginButton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { authenticated, user, logout } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (authenticated && user?.wallet?.address) {
      router.push('/my-portfolio');
    }
  }, [authenticated, user, router]);

  // If already authenticated, show logout option
  if (authenticated && user?.wallet?.address) {
    return (
      <div className="min-h-screen -mt-16 flex flex-col items-center justify-center bg-gradient-to-b from-[#010b1d] to-[#011330] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] animate-pulse opacity-20" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float-delayed" />
        </div>
        <div className="relative z-10 text-center text-white max-w-md px-8 animate-scale-up">
          <div className="bg-[#011330]/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/5 hover:border-primary/20 transition-all duration-300 group">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500" />
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-primary/5 mb-6 animate-float relative">
                <Wallet className="w-10 h-10 text-primary relative z-10" />
                <Sparkles className="w-5 h-5 text-primary/50 absolute -top-2 -right-2 animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-2 bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
              Wallet Connected
            </h2>
            <div className="bg-white/5 rounded-lg p-3 mb-6">
              <p className="text-gray-400 break-all font-mono text-sm">{user.wallet.address}</p>
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => router.push('/my-portfolio')}
                className="group flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white hover:bg-primary/90 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
              >
                Go to Portfolio
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={logout}
                className="px-6 py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen -mt-16 flex flex-col items-center justify-center bg-gradient-to-b from-[#010b1d] to-[#011330] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] animate-pulse opacity-20" />

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 mt-16 w-full max-w-6xl px-8 py-12 animate-scale-up">
        <div className="text-center mb-16 relative">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-xl bg-primary/5 mb-8 animate-float relative group">
              <Wallet className="w-12 h-12 text-primary relative z-10 group-hover:scale-110 transition-transform" />
              <Sparkles className="w-5 h-5 text-primary/50 absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-primary to-blue-400 bg-clip-text text-transparent relative">
            Welcome to Baskt
            <span className="absolute -top-6 -right-6 text-primary/20 animate-pulse">
              <Boxes className="w-12 h-12" />
            </span>
          </h1>
          <p className="text-2xl text-gray-400">Your Gateway to Decentralized Trading</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="group bg-[#011330]/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/5 hover:border-primary/20 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Shield className="w-8 h-8 text-primary relative z-10" />
                </div>
                <h2 className="text-xl font-semibold text-white">Security First</h2>
              </div>
              <ul className="space-y-6 text-gray-400">
                <li className="flex items-start gap-3 group/item hover:bg-white/5 p-3 rounded-lg transition-colors">
                  <Lock className="w-5 h-5 text-primary mt-1 group-hover/item:rotate-12 transition-transform" />
                  <span className="group-hover/item:text-white transition-colors">
                    Your keys, your assets - maintain full control over your funds
                  </span>
                </li>
                <li className="flex items-start gap-3 group/item hover:bg-white/5 p-3 rounded-lg transition-colors">
                  <Shield className="w-5 h-5 text-primary mt-1 group-hover/item:rotate-12 transition-transform" />
                  <span className="group-hover/item:text-white transition-colors">
                    Advanced encryption for all transactions and data
                  </span>
                </li>
                <li className="flex items-start gap-3 group/item hover:bg-white/5 p-3 rounded-lg transition-colors">
                  <Info className="w-5 h-5 text-primary mt-1 group-hover/item:rotate-12 transition-transform" />
                  <span className="group-hover/item:text-white transition-colors">
                    Regular security audits and updates
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="group bg-[#011330]/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/5 hover:border-primary/20 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <TrendingUp className="w-8 h-8 text-primary relative z-10" />
                </div>
                <h2 className="text-xl font-semibold text-white">Start Trading</h2>
              </div>
              <div className="space-y-6">
                <div className="relative group/wallet">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-xl blur opacity-30 group-hover/wallet:opacity-100 transition duration-500"></div>
                  <div className="relative flex flex-col items-center bg-[#011330]/90 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 group-hover/wallet:bg-primary/20 transition-colors">
                      <Wallet className="w-8 h-8 text-primary group-hover/wallet:scale-110 transition-transform" />
                    </div>
                    <div className="space-y-2 text-center">
                      <h3 className="text-lg font-semibold text-white">Connect Your Wallet</h3>
                      <p className="text-sm text-gray-400">Start trading in seconds</p>
                    </div>
                    <LoginButton />
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-white/5">
                  <p className="text-sm text-gray-400">
                    By connecting your wallet, you agree to our{' '}
                    <a
                      href="#"
                      className="text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary transition-colors"
                    >
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a
                      href="#"
                      className="text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="group bg-[#011330]/50 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/5 hover:border-primary/20 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Globe className="w-8 h-8 text-primary relative z-10" />
                </div>
                <h2 className="text-xl font-semibold text-white">Global Access</h2>
              </div>
              <ul className="space-y-6 text-gray-400">
                <li className="flex items-start gap-3 group/item hover:bg-white/5 p-3 rounded-lg transition-colors">
                  <TrendingUp className="w-5 h-5 text-primary mt-1 group-hover/item:rotate-12 transition-transform" />
                  <span className="group-hover/item:text-white transition-colors">
                    Trade across multiple blockchain networks
                  </span>
                </li>
                <li className="flex items-start gap-3 group/item hover:bg-white/5 p-3 rounded-lg transition-colors">
                  <Zap className="w-5 h-5 text-primary mt-1 group-hover/item:rotate-12 transition-transform" />
                  <span className="group-hover/item:text-white transition-colors">
                    Lightning-fast transactions and settlements
                  </span>
                </li>
                <li className="flex items-start gap-3 group/item hover:bg-white/5 p-3 rounded-lg transition-colors">
                  <Globe className="w-5 h-5 text-primary mt-1 group-hover/item:rotate-12 transition-transform" />
                  <span className="group-hover/item:text-white transition-colors">
                    24/7 access to global markets
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
