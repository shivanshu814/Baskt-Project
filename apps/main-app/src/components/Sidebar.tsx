import { ScrollArea } from '../components/src/scroll-area';
import { cn } from '@baskt/ui';
import { ArrowRightLeft, Home, LogOut, PieChart, Settings, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Baskt } from '../types/baskt';
import Link from 'next/link';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  baskt?: Baskt;
}

export function Sidebar({ isOpen, onClose, className }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: ArrowRightLeft, label: 'Trade', href: '/trade' },
    { icon: PieChart, label: 'Portfolio', href: '/my-portfolio' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  return (
    <div
      className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 transform bg-background transition-transform duration-200 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ScrollArea className="flex-1">
          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
        <div className="border-t p-4">
          <button
            onClick={() => {
              // Handle logout
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
