/**
 * Authentication Fixture
 *
 * Provides pre-authenticated browser context for tests that require login.
 * Uses Playwright's storage state to persist session across tests.
 */

import { test as base } from '@playwright/test';
import type { Page, BrowserContext } from '@playwright/test';
import { TEST_USERS } from './test-data.fixture.js';
import {
  ensureAuthenticatedSession,
  saveStorageState,
  writeEmptyStorageState,
} from '../utils/auth-session.js';

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
    await ensureAuthenticatedSession(page, TEST_USERS.default);

    await use(page);
  },
});

/**
 * Setup function to generate storage state
 * Run with: npx playwright test --project=setup
 */
export async function globalSetup(page: Page): Promise<void> {
  const authenticated = await ensureAuthenticatedSession(page, TEST_USERS.default);
  if (!authenticated) {
    writeEmptyStorageState(STORAGE_STATE_PATH);
    throw new Error('Unable to authenticate fixture setup user.');
  }

  await saveStorageState(page.context(), STORAGE_STATE_PATH);
}

export { expect } from '@playwright/test';
