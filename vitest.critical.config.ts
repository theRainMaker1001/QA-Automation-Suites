import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'critical',
    include: ['api/src/tests/critical/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**', 'coverage/**'],
    environment: 'node',
    testTimeout: 30000,
  },
});
