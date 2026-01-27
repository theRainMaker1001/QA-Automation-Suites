/**
 * Global Setup - Auth Optimization with Storage State
 *
 * Runs once before all tests to create authenticated session.
 * Saves storage state to file for reuse, reducing CI time by ~30s per test file.
 *
 * Usage: Configure as globalSetup in playwright.config.ts
 */

import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PARABANK_URL = 'https://parabank.parasoft.com/parabank';
const STORAGE_STATE_PATH = path.join(__dirname, '.auth', 'user.json');

// Test credentials from ParaBank demo
const TEST_USER = {
  username: 'john',
  password: 'demo',
};

async function globalSetup(_config: FullConfig): Promise<void> {
  console.log('[Global Setup] Creating authenticated session...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto(`${PARABANK_URL}/index.htm`);
    await page.waitForLoadState('domcontentloaded');

    // Fill login form
    await page.locator('input[name="username"]').fill(TEST_USER.username);
    await page.locator('input[name="password"]').fill(TEST_USER.password);

    // Submit login
    await page.locator('input[value="Log In"]').click();
    await page.waitForLoadState('networkidle');

    // Verify login success
    const logoutLink = page.locator('a:has-text("Log Out")');
    const isLoggedIn = (await logoutLink.count()) > 0;

    if (isLoggedIn) {
      // Save storage state (cookies, localStorage)
      await context.storageState({ path: STORAGE_STATE_PATH });
      console.log(`[Global Setup] Storage state saved to ${STORAGE_STATE_PATH}`);
    } else {
      console.warn('[Global Setup] Login may have failed - proceeding without storage state');
    }
  } catch (error) {
    console.error('[Global Setup] Error during authentication:', error);
    // Don't fail setup - tests will handle auth individually if needed
  } finally {
    await browser.close();
  }
}

export default globalSetup;
