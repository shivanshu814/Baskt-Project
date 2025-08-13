import { createStandaloneConfig } from '../../tsup.base.config';

export default createStandaloneConfig({
  entry: ['src/server/index.ts'],
  platform: 'node',
  external: [
    // Keep heavy database drivers external - install in container
    'pg',
    'mongoose', 
    'sequelize',
    // Keep these external as they're often environment-specific
    '@vercel/blob'
  ]
}) 