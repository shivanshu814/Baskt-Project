/** @format */

import '../styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClientLayout } from '../components/shared/ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Baskt | AI-Powered Trading & Index Management',
  description:
    'BASKT is an AI-driven trading platform that allows you to manage indexes, trading strategies, and platform settings with real-time AI-powered insights.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
