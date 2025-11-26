import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      'node_modules/**',
      '**/dist/**',
      '.github/**',
      '.reports/**',
      '**/*.md',
      'package-lock.json',
      '/reports/',
      '/.reports/',
      'reports/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
    ],
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },

  js.configs.recommended,

  // TypeScript (typed) — single pass, same locally and in CI
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // This enables typed linting without hardcoding project globs.
        // It lets @typescript-eslint use the *nearest* tsconfig per file (root/api/e2e).
        projectService: true,
        tsconfigRootDir: __dirname,
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        exports: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        AbortController: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      // Avoid duplicate base checks for TS
      'no-undef': 'off',
      'no-unused-vars': 'off',

      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': 'off',

      // Typed rules that actually catch real bugs
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
    },
  },

  // Tests / e2e: declare test globals to reduce noise
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'e2e/**/*.ts'],
    languageOptions: {
      globals: {
        // Vitest
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // Prevent formatting conflicts
  prettier,
];
