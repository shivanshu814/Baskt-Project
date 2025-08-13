import { createStandaloneConfig } from '../../tsup.base.config';pn

export default createStandaloneConfig({
  entry: ['src/index.ts'],
  platform: 'node',
  external: [
    // Guardian service has minimal external dependencies
    // All workspace packages will be bundled for standalone execution
  ]
});