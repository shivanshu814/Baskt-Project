'use client';

import { useState } from 'react';
import { cn } from '../lib/utils';
import { AdminNavbar } from './auth/AdminNavbar';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#010b1d] to-[#011330] relative overflow-hidden">
      <AdminNavbar setSidebarOpen={setSidebarOpen} />
      <div className="w-full max-w-[1600px] mx-auto px-6">
        <main className={cn('pt-24 pb-12', className)}>{children}</main>
      </div>
    </div>
  );
}
