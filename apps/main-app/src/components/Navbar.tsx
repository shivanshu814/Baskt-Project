'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { Wallet, LogOut, Plus } from 'lucide-react';
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '../components/src/navigation-menu';
import { Button } from './src/button';

interface NavbarProps {
  setSidebarOpen?: (open: boolean) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Navbar({ setSidebarOpen }: NavbarProps) {
  const { user, logout, authenticated } = usePrivy();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#010b1d]/80 backdrop-blur-xl border-b border-white/5 h-16">
      <div className="max-w-[1700px] h-full mx-auto flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <Link
            href="/homepage"
            className="flex items-center gap-2 font-bold text-xl tracking-tight"
          >
            <span className="text-primary">Baskt</span>
          </Link>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/dashboard" className={navigationMenuTriggerStyle()}>
                  Dashboard
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/my-portfolio" className={navigationMenuTriggerStyle()}>
                  My Portfolio
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/baskts" className={navigationMenuTriggerStyle()}>
                  Baskts
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/how-it-works" className={navigationMenuTriggerStyle()}>
                  How It Works
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        {authenticated && user?.wallet?.address ? (
          <div className="flex items-center gap-3">
            <Link href="/create-baskt">
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Plus className="h-4 w-4 mr-2" />
                Create Baskt
              </Button>
            </Link>
            <button className="bg-[#1a1f2e] text-white hover:bg-[#1a1f2e]/90 h-10 px-4 rounded-lg text-sm font-medium border border-white/10 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              {formatWalletAddress(user.wallet.address)}
            </button>
            <button
              onClick={handleLogout}
              className="bg-[#1a1f2e] text-red-400 hover:text-red-300 hover:bg-[#1a1f2e]/90 h-10 w-10 rounded-full border border-white/10 flex items-center justify-center"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Connect Wallet
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
