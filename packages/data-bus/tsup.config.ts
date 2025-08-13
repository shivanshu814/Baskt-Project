import { createStandaloneConfig } from '../../tsup.base.config';

export default createStandaloneConfig({
  entry: ['src/index.ts'],
  platform: 'node',
  external: [
    // Keep Redis external as it's a native dependency
    'ioredis'
  ],
  additionalOptions: {
    // Generate types for this package as it's a library
    dts: true
  }
});