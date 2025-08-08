'use client';

import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
  NumberFormat,
  PublicKeyText,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  useUser,
} from '@baskt/ui';
import { LogOut, Menu, WalletMinimal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { NAVIGATION_ITEMS } from '../../constants/navigation';
import { useUSDCBalance } from '../../hooks/pool/use-usdc-balance';
import { useWallet } from '../../hooks/wallet/use-wallet';
import { ROUTES } from '../../routes/route';

export function Navbar() {
  const { authenticated, handleLogout, handleLogin } = useWallet();
  const { userAddress } = useUser();
  const { balance: usdcBalance } = useUSDCBalance();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/30 shadow-lg shadow-black/5">
      <div className="max-w-full h-16 mx-auto flex items-center justify-between px-3 sm:px-3 lg:px-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Image
                src="/favicon.svg"
                alt="Baskt"
                width={32}
                height={32}
                className="h-8 w-8 transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">Baskt</span>
          </Link>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="gap-1">
              {NAVIGATION_ITEMS.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      'flex items-center gap-2 hover:text-primary transition-all duration-200 hover:bg-primary/5 rounded-lg px-3 py-2',
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-3">
          {/* desktop view */}
          <div className="hidden md:flex items-center gap-3">
            <Link href={ROUTES.CREATE_BASKT}>
              <Button
                variant="outline"
                size="sm"
                className="bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10"
              >
                Launch Baskt
              </Button>
            </Link>
            {authenticated && userAddress ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="bg-secondary/60 text-secondary-foreground hover:bg-secondary/80 h-10 px-4 rounded-lg text-sm font-medium border border-border/50 flex items-center gap-2 transition-all duration-200 hover:shadow-md">
                    <div className="bg-primary/20 p-1.5 rounded-full">
                      <WalletMinimal className="h-3 w-3 text-primary" />
                    </div>
                    <PublicKeyText publicKey={userAddress} />
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2">
                  <div className="p-3 border-b border-border/50 mb-2 rounded-md bg-secondary/20">
                    <div className="text-xs text-muted-foreground mb-1 font-medium">
                      Connected Wallet
                    </div>
                    <PublicKeyText publicKey={userAddress} isCopy={true} />
                  </div>
                  <div className="p-3 border-b border-border/50 mb-2 rounded-md bg-secondary/20">
                    <div className="text-xs text-muted-foreground mb-1 font-medium">
                      Your Balance
                    </div>
                    <div className="text-sm font-semibold">
                      <NumberFormat
                        value={Number(usdcBalance) * 1e6}
                        isPrice={true}
                        showCurrency={true}
                      />
                    </div>
                  </div>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive cursor-pointer rounded-sm"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect Wallet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={handleLogin}
                variant="outline"
                size="sm"
                className="bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10"
              >
                <WalletMinimal className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>

          {/* mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] sm:w-[350px] flex flex-col p-0 bg-background/95 backdrop-blur-xl border-l border-border/30"
            >
              <SheetHeader className="p-4 border-b border-border/30">
                <SheetTitle className="flex items-center gap-3">
                  <div className="relative">
                    <Image
                      src="/favicon.svg"
                      alt="Baskt"
                      width={24}
                      height={24}
                      className="h-6 w-6"
                    />
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-md" />
                  </div>
                  <span className="text-lg font-bold text-primary">Baskt</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex-grow overflow-y-auto p-4">
                <div className="flex flex-col gap-1">
                  {NAVIGATION_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center px-4 py-3 text-base font-medium rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200 gap-3 group"
                    >
                      <item.icon className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="border-t border-border/30 p-4 space-y-3">
                {authenticated && userAddress ? (
                  <div className="space-y-3">
                    <div className="p-3 text-sm rounded-lg border border-border/30 bg-secondary/20">
                      <div className="text-xs text-muted-foreground mb-1 font-medium">
                        Connected Wallet
                      </div>
                      <PublicKeyText publicKey={userAddress} isCopy={true} />
                    </div>
                    <div className="p-3 text-sm rounded-lg border border-border/30 bg-secondary/20">
                      <div className="text-xs text-muted-foreground mb-1 font-medium">
                        USDC Balance
                      </div>
                      <div className="text-sm font-semibold">
                        <NumberFormat
                          value={Number(usdcBalance) * 1e6}
                          isPrice={true}
                          showCurrency={true}
                        />
                      </div>
                    </div>
                    <Link href={ROUTES.CREATE_BASKT} className="w-full block">
                      <Button
                        variant="outline"
                        className="w-full bg-primary/10 border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-all duration-200"
                      >
                        Launch Baskt
                      </Button>
                    </Link>

                    <Button variant="destructive" className="w-full" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Disconnect Wallet
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/20"
                    onClick={handleLogin}
                  >
                    <WalletMinimal className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
