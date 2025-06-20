'use client';

import { ThemeProvider } from 'next-themes';
import { BasktClientProvider, PrivyProvider } from '@baskt/ui';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from '../../utils/trpc';
import { Toaster } from '@baskt/ui';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/trpc',
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
              {children}
              <Toaster />
            </BasktClientProvider>
          </PrivyProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
