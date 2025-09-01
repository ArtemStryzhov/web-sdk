import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020,
      },
      globals: {
        browser: true,
        es2017: true,
        node: true,
        URL: 'readonly',
        $state: 'readonly',
        console: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_', 'ignoreRestSiblings': true }],
      '@typescript-eslint/no-explicit-any': 'off', // Allow any types for flexibility
    },
    ignores: ['node_modules/**', 'dist/**', '.svelte-kit/**', 'build/**'],
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
      },
      globals: {
        browser: true,
        es2017: true,
        node: true,
        URL: 'readonly',
        $state: 'readonly',
        console: 'readonly',
      },
    },
    plugins: {
      svelte: sveltePlugin,
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...sveltePlugin.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      'no-unused-vars': 'off', // Turn off base rule for Svelte files
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_', 'ignoreRestSiblings': true }],
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in Svelte files for flexibility
    },
    ignores: ['node_modules/**', 'dist/**', '.svelte-kit/**', 'build/**'],
  },
];
