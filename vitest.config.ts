// vitest.config.ts (repo root)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only collect API tests under api/src and only *.test.ts
    include: ['api/src/**/*.test.ts'],
    // Make absolutely sure Vitest never touches Playwright files
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', 'coverage/**'],
    environment: 'node',
  },
});
