export default [
  {
    languageOptions: {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020,
      },
      globals: {
        browser: true,
        es2017: true,
        node: true,
      },
    },
    extends: ['eslint:recommended', '@typescript-eslint/recommended'],
    plugins: ['@typescript-eslint'],
    rules: {
      // Add any custom rules here
    },
    ignorePatterns: ['node_modules/**', 'dist/**'],
  },
];
