'use client';

import dynamic from 'next/dynamic';
import { ThemeProvider } from 'next-themes';

const Toaster = dynamic(() => import('./src/toaster').then((mod) => mod.Toaster), { ssr: false });
const Sonner = dynamic(() => import('./src/sonner').then((mod) => mod.Toaster), { ssr: false });
const PrivyProvider = dynamic(
  () => import('../providers/PrivyProvider').then((mod) => mod.PrivyProvider),
  { ssr: false },
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <PrivyProvider>
        <Toaster />
        <Sonner />
        {children}
      </PrivyProvider>
    </ThemeProvider>
  );
}
