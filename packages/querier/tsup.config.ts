import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  target: 'node18',
  platform: 'node',
  external: [
    '@baskt/sdk',
    '@baskt/types',
    '@coral-xyz/anchor',
    '@solana/web3.js',
    '@solana/spl-token',
    'bn.js',
    'mongoose',
    'pg',
    'sequelize',
    'redis',
    'dotenv',
    'zod',
  ],
});
