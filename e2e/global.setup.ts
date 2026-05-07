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
import { TEST_USERS } from './fixtures/test-data.fixture.js';
import {
  ensureAuthenticatedSession,
  saveStorageState,
  writeEmptyStorageState,
} from './utils/auth-session.js';
import {
  collectLoginSurfaceDiagnostics,
  formatLoginSurfaceUnavailableError,
} from './utils/login-surface-diagnostics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_STATE_PATH = path.join(__dirname, '.auth', 'user.json');

async function globalSetup(_config: FullConfig): Promise<void> {
  console.log('[Global Setup] Creating authenticated session...');

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const authenticated = await ensureAuthenticatedSession(page, TEST_USERS.default);

    if (authenticated) {
      await saveStorageState(context, STORAGE_STATE_PATH);
      console.log(`[Global Setup] Storage state saved to ${STORAGE_STATE_PATH}`);
    } else {
      console.warn('[Global Setup] Login may have failed - creating empty storage state');
      writeEmptyStorageState(STORAGE_STATE_PATH);
    }
  } catch (error) {
    console.error('[Global Setup] Error during authentication:', error);
    const diagnostics = await collectLoginSurfaceDiagnostics(page, {
      reason: 'global setup could not authenticate before storage-state creation',
    });
    console.error(`[Global Setup] ${formatLoginSurfaceUnavailableError(diagnostics)}`);
    console.error('[Global Setup] Login surface diagnostics:', JSON.stringify(diagnostics));
    writeEmptyStorageState(STORAGE_STATE_PATH);
    console.log('[Global Setup] Created empty storage state as fallback');
  } finally {
    await browser.close();
  }
}

export default globalSetup;
