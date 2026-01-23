import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'unit',
    include: ['api/src/tests/unit/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', 'coverage/**'],
    environment: 'node',
    testTimeout: 5000,
    reporters: ['verbose', 'json'],
    outputFile: {
      json: '.reports/unit-report.json',
    },
  },
});
