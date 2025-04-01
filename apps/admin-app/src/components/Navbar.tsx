import { Button } from '../components/src/button';
import { User, LogOut, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import Link from 'next/link';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '../components/src/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../components/src/dropdown-menu';
import { ThemeSwitch } from './ThemeSwitch';

interface NavbarProps {
  setSidebarOpen: (open: boolean) => void;
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border h-16 flex items-center px-4 md:px-6',
        className,
      )}
    >
      <div className="w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="text-primary">Baskt</span>
          </Link>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {/* <NavigationMenuItem>
                <Link href="/baskts" className={navigationMenuTriggerStyle()}>
                  Explore
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/portfolio" className={navigationMenuTriggerStyle()}>
                  Portfolio
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/how-it-works" className={navigationMenuTriggerStyle()}>
                  How It Works
                </Link>
              </NavigationMenuItem> */}
              <NavigationMenuItem>
                <Link href="/admin" className={navigationMenuTriggerStyle()}>
                  <ShieldCheck className="h-4 w-4 mr-1" />
                  Admin
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex items-center gap-2">
          {/* <Link href="/create-baskt">
            <Button variant="outline" size="sm" className="hidden md:flex">
              <Plus className="h-4 w-4 mr-2" />
              Create Baskt
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button> */}
          <ThemeSwitch />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">Profile</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <ShieldCheck className="mr-2 h-4 w-4" />
                <Link href="/admin">Admin Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
