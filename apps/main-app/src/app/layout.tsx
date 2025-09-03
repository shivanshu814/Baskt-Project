import { BasktClientProvider, PrivyProvider } from '@baskt/ui';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { Navbar } from '../components/shared/Navbar';
import { ReferralTracker } from '../components/shared/ReferralTracker';
import { TRPCProvider } from '../providers/backend';
import { ToastProvider } from '../providers/toast';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Baskt | AI-Powered Trading & Index Management',
  description:
    'BASKT is an AI-driven trading platform that allows you to manage indexes, trading strategies, and platform settings with real-time AI-powered insights.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body className={inter.className}>
        <PrivyProvider>
          <BasktClientProvider>
            <TRPCProvider>
              <ToastProvider>
                <ErrorBoundary>
                  <ReferralTracker />
                  <Navbar />
                  <main className="mt-16">{children}</main>
                </ErrorBoundary>
              </ToastProvider>
            </TRPCProvider>
          </BasktClientProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
