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
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PARABANK_URL = 'https://parabank.parasoft.com/parabank';
const AUTH_DIR = path.join(__dirname, '.auth');
const STORAGE_STATE_PATH = path.join(AUTH_DIR, 'user.json');

// Test credentials from ParaBank demo
const TEST_USER = {
  username: 'john',
  password: 'demo',
};

async function globalSetup(_config: FullConfig): Promise<void> {
  console.log('[Global Setup] Creating authenticated session...');

  // Ensure auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    console.log(`[Global Setup] Created auth directory: ${AUTH_DIR}`);
  }

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
      console.warn('[Global Setup] Login may have failed - creating empty storage state');
      // Create empty storage state so chromium-auth project doesn't fail on missing file
      fs.writeFileSync(STORAGE_STATE_PATH, JSON.stringify({ cookies: [], origins: [] }));
    }
  } catch (error) {
    console.error('[Global Setup] Error during authentication:', error);
    // Create empty storage state as fallback so tests don't fail on missing file
    if (!fs.existsSync(STORAGE_STATE_PATH)) {
      fs.writeFileSync(STORAGE_STATE_PATH, JSON.stringify({ cookies: [], origins: [] }));
      console.log('[Global Setup] Created empty storage state as fallback');
    }
  } finally {
    await browser.close();
  }
}

export default globalSetup;
