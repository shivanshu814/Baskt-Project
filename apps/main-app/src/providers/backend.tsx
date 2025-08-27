'use client';

import { useUser } from '@baskt/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import React, { useMemo, useState } from 'react';
import { trpc } from '../lib/api/trpc';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { getJwtToken, isAuthenticated } = useUser();
  const [queryClient] = useState(() => new QueryClient());

  const trpcClient = useMemo(() => {
    return trpc.createClient({
      links: [
        httpBatchLink({
          url: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000/trpc',

          headers: async () => {
            if (!isAuthenticated) {
              return {};
            }

            try {
              const token = await getJwtToken();
              if (token) {
                return {
                  authorization: `Bearer ${token}`,
                };
              }
            } catch (error) {
              console.error('[TRPC] Failed to get JWT token:', error);
            }

            return {};
          },
        }),
      ],
    });
  }, [isAuthenticated, getJwtToken]);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
