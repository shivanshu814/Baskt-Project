import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    manager: 'src/manager.ts',
    'oracle-worker': 'src/oracle-worker.ts',
    'rebalance/manager': 'src/rebalance/manager.ts',
    'rebalance/worker': 'src/rebalance/worker.ts',
    'nav-tracker': 'src/nav-tracker/nav-tracker.ts',
  },
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
    '@baskt/querier',
    '@baskt/types',
    '@solana/web3.js',
    '@coral-xyz/anchor',
    '@baskt/sdk',
    'axios',
    'bn.js',
    'bullmq',
    'dotenv',
    'ioredis',
    'mongoose',
    'sequelize',
    'uuid',
    'ws',
  ],
});
