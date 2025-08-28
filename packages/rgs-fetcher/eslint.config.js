export default [
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        browser: true,
        es2017: true,
        node: true,
      },
    },
    rules: {
      // Basic rules that work without additional plugins
      'no-unused-vars': 'error',
      'no-console': 'warn',
      // Add any custom rules here
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**'],
  },
];
