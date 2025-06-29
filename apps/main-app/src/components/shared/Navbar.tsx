'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { Wallet, LogOut, Plus, Copy, Menu } from 'lucide-react';
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
  PublicKeyText,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@baskt/ui';
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
    toast.success('Wallet disconnected successfully');
    router.push('/');
  };

  const copyAddress = () => {
    if (user?.wallet?.address) {
      navigator.clipboard.writeText(user.wallet.address);
      toast.success('Address copied to clipboard');
    }
  };

  const navigationItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/baskts', label: 'Baskts' },
    { href: '/earn', label: 'Earn' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border h-16">
      <div className="max-w-[1700px] h-full mx-auto flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="text-primary">Baskt</span>
          </Link>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <Link href={item.href} className={navigationMenuTriggerStyle()}>
                    {item.label}
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-2">
          {/* desktop view */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3">
            <Link href="/create-baskt">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Baskt
              </Button>
            </Link>
            {authenticated && user?.wallet?.address ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-3 sm:px-4 rounded-lg text-sm font-medium border border-border flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    <PublicKeyText publicKey={user.wallet.address} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={copyAddress}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Address
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => login()} variant="outline" size="sm">
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>

          {/* mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px] flex flex-col p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex-grow overflow-y-auto p-4">
                <div className="flex flex-col gap-2">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center px-3 py-2 text-base font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="border-t p-4 space-y-3">
                {authenticated && user?.wallet?.address ? (
                  <div className="space-y-2">
                    <div className="p-2 text-sm rounded-md border text-center">
                      <PublicKeyText publicKey={user.wallet.address} />
                    </div>
                    <Button variant="outline" className="w-full" onClick={copyAddress}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Address
                    </Button>
                    <Button variant="destructive" className="w-full" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Disconnect Wallet
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full" onClick={() => login()}>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                )}
                <Link href="/create-baskt" className="w-full block">
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Baskt
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
