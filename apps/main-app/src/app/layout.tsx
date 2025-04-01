/** @format */

import '../styles/globals.css';
import { Providers } from './providers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Baskt + Waifu | AI-Powered Trading & Indexing',
  description:
    'BASKT AI empowers you to create custom AI-driven indexes and trading strategies. Trade Meme Token Arbitrage, DeFi Yield, AI Indexes, and more with real-time AI-powered execution.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
