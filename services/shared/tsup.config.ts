import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: {
    // Use a separate tsconfig for DTS generation
    compilerOptions: {
      composite: false,
      incremental: false
    }
  },
  tsconfig: './tsconfig.json',
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  target: 'node18',
  platform: 'node',
  external: [
    'winston',
    'prom-client',
    'bignumber.js'
  ]
});