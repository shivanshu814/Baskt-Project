'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { Wallet, LogOut, Plus, Copy } from 'lucide-react';
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from './ui/navigation-menu';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner';
interface NavbarProps {
  setSidebarOpen?: (open: boolean) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Navbar({ setSidebarOpen }: NavbarProps) {
  const { user, logout, authenticated, login } = usePrivy();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const copyAddress = () => {
    if (user?.wallet?.address) {
      navigator.clipboard.writeText(user.wallet.address);
      toast.success('Address copied to clipboard');
    }
  };

  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#010b1d]/80 backdrop-blur-xl border-b border-white/5 h-16">
      <div className="max-w-[1700px] h-full mx-auto flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
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
              <NavigationMenuItem>
                <Link href="/pool" className={navigationMenuTriggerStyle()}>
                  Pool
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/faucet" className={navigationMenuTriggerStyle()}>
                  Faucet
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="bg-[#1a1f2e] text-white hover:bg-[#1a1f2e]/90 h-10 px-4 rounded-lg text-sm font-medium border border-white/10 flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  {formatWalletAddress(user.wallet.address)}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={copyAddress}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Address
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-400">
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/create-baskt">
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Plus className="h-4 w-4 mr-2" />
                Create Baskt
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => login()}>
              Connect Wallet
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
