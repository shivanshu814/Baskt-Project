'use client';

import { ThemeProvider } from 'next-themes';
import { BasktClientProvider, PrivyProvider } from '@baskt/ui';
import { Toaster } from '@baskt/ui';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <PrivyProvider>
        <BasktClientProvider>
          {children}
          <Toaster
            position="bottom-left"
            closeButton={true}
            duration={20000}
            toastOptions={{
              classNames: {
                toast:
                  'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
                description: 'group-[.toast]:text-muted-foreground',
                actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
                closeButton: 'group-[.toast]:opacity-100 group-[.toast]:hover:opacity-100',
              },
            }}
          />
        </BasktClientProvider>
      </PrivyProvider>
    </ThemeProvider>
  );
}
