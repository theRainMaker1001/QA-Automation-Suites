import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'integration',
    include: ['api/src/tests/integration/**/*.test.ts', 'api/src/tests/critical/**/*.test.ts'],
    exclude: [
      'api/src/tests/critical/loan-decision-table.test.ts',
      'e2e/**',
      'node_modules/**',
      'dist/**',
      'coverage/**',
    ],
    environment: 'node',
    testTimeout: 30000,
    reporters: [
      'verbose',
      ['allure-vitest/reporter', { resultsDir: 'allure-results/integration' }],
    ],
  },
});
