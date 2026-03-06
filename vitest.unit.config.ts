import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'unit',
    include: [
      'api/src/tests/unit/**/*.test.ts',
      // Pure E2E utility functions with no Playwright dependency may be listed
      // here individually. Do not add a broad e2e/** glob — the node environment
      // cannot load Playwright browser modules.
      'e2e/utils/network-errors.test.ts',
    ],
    exclude: ['node_modules/**', 'dist/**', 'coverage/**'],
    environment: 'node',
    testTimeout: 5000,
    reporters: [
      'verbose',
      'json',
      ['allure-vitest/reporter', { resultsDir: 'allure-results/unit' }],
    ],
    outputFile: {
      json: 'reports/unit-report.json',
    },
  },
});
