/**
 * @format
 * @type {import('next').NextConfig}
 */

const isProd = process.env.NODE_ENV === 'production';

const scriptSrc = ["'self'", 'https://challenges.cloudflare.com'].filter(Boolean).join(' ');

const connectSrc = [
  "'self'",
  'https://auth.privy.io',
  'wss://relay.walletconnect.com',
  'wss://relay.walletconnect.org',
  'wss://www.walletlink.org',
  'https://*.rpc.privy.systems',
  'https://explorer-api.walletconnect.com',
  'https://staging-be.baskt.ai',
]
  .filter(Boolean)
  .join(' ');

const imgSrc = [
  "'self'",
  'data:',
  'blob:',
  'https://explorer-api.walletconnect.com',
  'https://assets.coingecko.com',
  'https://pro-api.coinmarketcap.com',
  'https://hshbrs4fj4e0u45f.public.blob.vercel-storage.com',
].join(' ');

const ContentSecurityPolicy =
  [
    "default-src 'self'",
    `script-src ${scriptSrc} chrome-extension:`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc} chrome-extension:`,
    "font-src 'self' chrome-extension:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'child-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org chrome-extension:',
    'frame-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com chrome-extension:',
    `connect-src ${connectSrc} chrome-extension:`,
    "worker-src 'self' chrome-extension:",
    "manifest-src 'self'",
  ].join('; ') + ';';

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@baskt/ui'],
  async headers() {
    if (!isProd) {
      return [];
    }

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy-Report-Only',
            value: ContentSecurityPolicy,
          },
        ],
      },
    ];
  },
  images: {
    domains: ['assets.coingecko.com', 'dd.dexscreener.com', 'binance.com', 's2.coinmarketcap.com'],
  },
};

module.exports = nextConfig;
