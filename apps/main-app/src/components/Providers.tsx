'use client';

import dynamic from 'next/dynamic';
import { ThemeProvider } from 'next-themes';
import { BasktClientProvider, PrivyProvider } from '@baskt/ui';

const Toaster = dynamic(() => import('./src/toaster').then((mod) => mod.Toaster), { ssr: false });
const Sonner = dynamic(() => import('./src/sonner').then((mod) => mod.Toaster), { ssr: false });

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <PrivyProvider>
        <BasktClientProvider>
          <Toaster />
          <Sonner />
          {children}
        </BasktClientProvider>
      </PrivyProvider>
    </ThemeProvider>
  );
}
