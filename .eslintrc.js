module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['plugin:@next/next/recommended'],
  env: {
    node: true,
    browser: true,
    es6: true,
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      env: {
        jest: true,
        mocha: true,
      },
    },
  ],
};
