/** @format */

import '../styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '../components/ui/toaster';
import { PrivyProvider, BasktClientProvider } from '@baskt/ui';
import { ReactNode } from 'react';
import { TRPCProvider } from '../providers/TRPCProvider';
import { TooltipProvider } from '../components/ui/tooltip';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Baskt Admin | AI-Powered Trading & Index Management',
  description:
    'BASKT Admin Panel allows you to manage AI-driven indexes, trading strategies, user permissions, and platform settings with real-time AI-powered insights.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body className={`${inter.className} bg-background`}>
        <PrivyProvider>
          <BasktClientProvider>
            <TooltipProvider>
              <TRPCProvider>
                {children}
                <Toaster />
              </TRPCProvider>
            </TooltipProvider>
          </BasktClientProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
