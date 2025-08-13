import { createStandaloneConfig } from '../../tsup.base.config';

export default createStandaloneConfig({
  entry: ['src/listener.ts'],
  platform: 'node',
  external: [
    // Keep Redis-related packages external as they're native/complex
    'ioredis',
    'bullmq'
  ]
}) 