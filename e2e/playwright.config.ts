import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const STORAGE_STATE_PATH = path.join(__dirname, '.auth', 'user.json');

/**
 * Playwright Configuration - Risk-Based Testing Lanes
 *
 * Projects:
 * - setup: Creates authenticated session (runs first)
 * - chromium/firefox/webkit: Main browser testing
 * - chromium-auth: Uses storage state for faster @critical tests
 */
export default defineConfig({
  testDir: './tests',

  /* Global setup for auth optimization */
  globalSetup: './global.setup.ts',

  /* Execution model */
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  /* Reporters */
  reporter: [['list'], ['html', { open: 'never' }]],

  /* Shared settings */
  use: {
    baseURL: process.env.BANK_BASE_URL ?? 'https://parabank.parasoft.com/parabank',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
  },

  /* Testing Lane Projects */
  projects: [
    // Main browser projects (no auth state)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Authenticated project for @critical and @smoke lanes (faster)
    {
      name: 'chromium-auth',
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE_PATH,
      },
    },
  ],
});
