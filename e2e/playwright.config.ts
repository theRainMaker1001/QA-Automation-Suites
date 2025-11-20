import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  // Where tests live (relative to this config file)
  testDir: './tests',

  /* Execution model */
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // fail CI if test.only is committed
  retries: process.env.CI ? 2 : 0, // a little flake protection in CI
  workers: process.env.CI ? 1 : undefined,

  /* Reporters */
  reporter: [
    ['list'], // pretty console output
    ['html', { open: 'never' }], // HTML report (don’t auto-open in CI)
    // ['junit', { outputFile: 'reports/junit.xml' }], // ← enable for CI dashboards
  ],

  /* Shared settings for all projects */
  use: {
    // baseURL: 'http://localhost:3000',  // set if your app runs locally
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    // storageState: 'storageState.json', // reuse logged-in state across tests
  },

  /* Configure projects for major browsers */
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },

    /* Test against mobile viewports. */
    // { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    // { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },

    /* Test against branded browsers. */
    // { name: 'Microsoft Edge', use: { ...devices['Desktop Edge'], channel: 'msedge' } },
    // { name: 'Google Chrome',  use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000
  // },
});
