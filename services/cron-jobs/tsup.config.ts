import { createStandaloneConfig } from '../../tsup.base.config';

export default createStandaloneConfig({
  entry: ['src/index.ts'],
  platform: 'node',
  external: [
    // Keep heavy/native packages external
    'bullmq',
    'ioredis', 
    'mongoose',
    'sequelize',
    'ws' // WebSocket native dependency
  ]
});
