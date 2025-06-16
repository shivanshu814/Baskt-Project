'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { cn, PublicKeyText } from '@baskt/ui';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { User, LogOut, ShieldCheck, Wallet } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from '../ui/navigation-menu';
import { useState } from 'react';
import { AdminNavbarProps } from '../../types';

export function AdminNavbar({ className }: AdminNavbarProps) {
  const router = useRouter();
  const { logout, user, login } = usePrivy();
  const activeWallet = user?.wallet;
  const [isLoggingOut, setIsLoggingOut] = useState(false); //eslint-disable-line

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      document.body.insertAdjacentHTML(
        'beforeend',
        `<div id="logout-overlay" class="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-b from-[#010b1d] to-[#011330]">
          <div class="flex flex-col items-center gap-4">
            <div class="relative">
              <div class="h-24 w-24 rounded-full border-2 border-white/10 border-t-blue-500 animate-spin"></div>
              <div class="absolute inset-0 h-24 w-24 rounded-full border-2 border-white/5 border-r-blue-500 animate-spin-slow"></div>
            </div>
            <p class="text-lg text-white/60 animate-pulse mt-6">Signing out...</p>
          </div>
        </div>`,
      );

      await logout();
      Cookies.remove('wallet-connected');

      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push('/');
    } catch (error) {
      router.push('/');
    } finally {
      document.getElementById('logout-overlay')?.remove();
      setIsLoggingOut(false);
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 bg-[#010b1d]/80 backdrop-blur-xl border-b border-white/5 h-16',
        className,
      )}
    >
      <div className="max-w-[1700px] h-full mx-auto flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center text-sm font-medium text-white/60 hover:text-white"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Admin
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-[#1a1f2e] !text-white hover:!bg-[#1a1f2e]/90 !h-10 !px-4 !rounded-lg !text-sm font-medium border border-white/10"
                  onClick={() => !activeWallet && login()}
                >
                  {activeWallet ? (
                    <>
                      <Wallet className="h-4 w-4 mr-2" />
                      <PublicKeyText publicKey={activeWallet?.address || ''} />
                    </>
                  ) : (
                    'Connect Wallet'
                  )}
                </Button>
              </TooltipTrigger>
              {activeWallet && (
                <TooltipContent
                  side="bottom"
                  sideOffset={5}
                  className="bg-[#1a1f2e] text-white px-3 py-2 rounded-lg border border-white/10"
                >
                  <p className="font-mono text-sm">{activeWallet.address}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          {activeWallet && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-[#1a1f2e] !text-white hover:!bg-[#1a1f2e]/90 !h-10 !w-10 !rounded-full border border-white/10"
                >
                  <User className="h-4 w-4" />
                  <span className="sr-only">Profile</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#0d1117] text-white border border-white/10 rounded-xl shadow-xl w-48 py-2 px-2"
              >
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="hover:!bg-[#1a1f2e] cursor-pointer px-4 py-2.5 text-red-400 [&:hover]:text-red-400"
                >
                  <LogOut className="h-4 w-4 mr-2 text-red-400" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
