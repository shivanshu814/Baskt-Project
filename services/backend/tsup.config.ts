import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server/index.ts'],
  format: ['esm'],
  dts: true,
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
    '@solana/spl-token',
    '@trpc/server',
    '@vercel/blob',
    'bn.js',
    'cors',
    'dotenv',
    'express',
    'mongoose',
    'pg',
    'sequelize',
    'zod'
  ]
}) 