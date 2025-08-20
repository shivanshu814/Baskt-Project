import { createStandaloneConfig } from '../../tsup.base.config';

export default createStandaloneConfig({
  entry: ['src/index.ts'],
  platform: 'node',
  external: [
    // Keep database drivers external
    'mongoose',
    'pg', 
    'sequelize',
    'redis'
  ],
  additionalOptions: {
    // Generate types for this package as it's a library
    dts: true,
    minify: false
  }
});
