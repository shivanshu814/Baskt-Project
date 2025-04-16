'use client';

import dynamic from 'next/dynamic';
import { ThemeProvider } from 'next-themes';
import { BasktClientProvider, PrivyProvider } from '@baskt/ui';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from '../utils/trpc';

const Toaster = dynamic(() => import('./ui/toaster').then((mod) => mod.Toaster), { ssr: false });
const Sonner = dynamic(() => import('./ui/sonner').then((mod) => mod.Toaster), { ssr: false });

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: process.env.NEXT_PUBLIC_TRPC_URL || 'http://localhost:4000/trpc',
        }),
      ],
    }),
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PrivyProvider>
            <BasktClientProvider>
              <Toaster />
              <Sonner />
              {children}
            </BasktClientProvider>
          </PrivyProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
