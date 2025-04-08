'use client';

import { useState } from 'react';
import { Navbar } from './Navbar';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar setSidebarOpen={setSidebarOpen} />
      <main className={cn('flex-1 pt-16 p-4 md:p-6 overflow-y-auto', className)}>{children}</main>
    </div>
  );
}
