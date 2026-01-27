/**
 * Authentication Fixture
 *
 * Provides pre-authenticated browser context for tests that require login.
 * Uses Playwright's storage state to persist session across tests.
 */

import { test as base, expect } from '@playwright/test';
import type { Page, BrowserContext } from '@playwright/test';
import { TEST_USERS } from './test-data.fixture.js';

const PARABANK_URL = 'https://parabank.parasoft.com/parabank';
const STORAGE_STATE_PATH = 'e2e/.auth/user.json';

export type AuthFixtures = {
  authenticatedPage: Page;
  authenticatedContext: BrowserContext;
};

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  authenticatedContext: async ({ browser }, use) => {
    // Try to use existing storage state, fall back to fresh login
    let context: BrowserContext;

    try {
      context = await browser.newContext({
        storageState: STORAGE_STATE_PATH,
      });
    } catch {
      // Storage state doesn't exist, create fresh context
      context = await browser.newContext();
    }

    await use(context);
    await context.close();
  },

  authenticatedPage: async ({ authenticatedContext }, use) => {
    const page = await authenticatedContext.newPage();

    // Navigate to check if session is valid
    await page.goto(`${PARABANK_URL}/overview.htm`);
    await page.waitForLoadState('networkidle');

    // Check if we need to login
    const isLoggedIn = (await page.locator('a:has-text("Log Out")').count()) > 0;

    if (!isLoggedIn) {
      // Perform login
      await page.goto(`${PARABANK_URL}/index.htm`);
      await page.locator('input[name="username"]').fill(TEST_USERS.default.username);
      await page.locator('input[name="password"]').fill(TEST_USERS.default.password);
      await page.locator('input[value="Log In"]').click();
      await page.waitForLoadState('networkidle');
    }

    await use(page);
  },
});

/**
 * Setup function to generate storage state
 * Run with: npx playwright test --project=setup
 */
export async function globalSetup(page: Page): Promise<void> {
  await page.goto(`${PARABANK_URL}/index.htm`);

  // Login with test credentials
  await page.locator('input[name="username"]').fill(TEST_USERS.default.username);
  await page.locator('input[name="password"]').fill(TEST_USERS.default.password);
  await page.locator('input[value="Log In"]').click();

  // Wait for login to complete
  await expect(page.locator('a:has-text("Log Out")')).toBeVisible({ timeout: 10000 });

  // Save storage state
  await page.context().storageState({ path: STORAGE_STATE_PATH });
}

export { expect } from '@playwright/test';
