import { defineConfig } from 'tsup';

/**
 * Base tsup configuration for standalone service deployment
 * This config bundles all workspace packages for true standalone execution
 */
export const createStandaloneConfig = (options: {
  entry: string[];
  platform?: 'node' | 'browser';
  external?: string[];
  additionalOptions?: any;
}) => {
  const { entry, platform = 'node', external = [], additionalOptions = {} } = options;
  
  return defineConfig({
    entry,
    format: ['esm'],
    dts: false, // Skip .d.ts for production builds
    splitting: false,
    sourcemap: false, // Skip sourcemaps for production
    clean: true,
    outDir: 'dist',
    target: platform === 'node' ? 'node18' : 'es2022',
    platform,
    minify: true, // Minify for production
    treeshake: true, // Remove unused code
    bundle: true, // Bundle everything
    external: [
      // Only external these heavy/native dependencies that can't be bundled
      'pg-native',
      'sqlite3',
      'mysql',
      'mysql2',
      'oracledb',
      'tedious',
      'pg-query-stream',
      'ioredis',
      'bullmq',
      'redis',
      // Add any other native modules that cause bundling issues
      ...external
    ],
    esbuildOptions(options: any) {
      // Ensure all workspace packages are bundled
      options.packages = 'bundle';
      options.mainFields = ['module', 'main'];
      options.conditions = ['import', 'module', 'default'];
    },
    ...additionalOptions
  });
};
