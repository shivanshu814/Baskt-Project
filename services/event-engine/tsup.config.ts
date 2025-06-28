import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/listener.ts'],
  format: ['esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  target: 'node18',
  platform: 'node',
  external: [
    // External dependencies that should not be bundled
    '@baskt/sdk',
    '@baskt/types',
    '@coral-xyz/anchor',
    '@solana/web3.js',
    '@trpc/client',
    'bn.js',
    'bullmq',
    'dotenv',
    'ioredis'
  ]
}) 