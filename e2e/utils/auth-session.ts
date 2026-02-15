import fs from 'node:fs';
import path from 'node:path';
import type { BrowserContext, Page } from '@playwright/test';

const DEFAULT_BASE_URL = 'https://parabank.parasoft.com/parabank';

export interface AuthCredentials {
  username: string;
  password: string;
}

export function getBaseUrl(): string {
  return process.env.BANK_BASE_URL ?? DEFAULT_BASE_URL;
}

export function ensureStorageStateDir(storageStatePath: string): void {
  const storageDir = path.dirname(storageStatePath);
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
}

export function writeEmptyStorageState(storageStatePath: string): void {
  ensureStorageStateDir(storageStatePath);
  fs.writeFileSync(storageStatePath, JSON.stringify({ cookies: [], origins: [] }));
}

export async function isLoggedIn(page: Page): Promise<boolean> {
  return (await page.locator('a:has-text("Log Out")').count()) > 0;
}

export async function loginWithCredentials(
  page: Page,
  credentials: AuthCredentials,
  baseUrl: string = getBaseUrl(),
): Promise<void> {
  await page.goto(`${baseUrl}/index.htm`);
  await page.waitForLoadState('domcontentloaded');
  await page.locator('input[name="username"]').fill(credentials.username);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.locator('input[value="Log In"]').click();
  await page.waitForLoadState('networkidle');
}

export async function ensureAuthenticatedSession(
  page: Page,
  credentials: AuthCredentials,
  baseUrl: string = getBaseUrl(),
): Promise<boolean> {
  await page.goto(`${baseUrl}/overview.htm`);
  await page.waitForLoadState('domcontentloaded');

  if (await isLoggedIn(page)) {
    return true;
  }

  await loginWithCredentials(page, credentials, baseUrl);
  return isLoggedIn(page);
}

export async function saveStorageState(
  context: BrowserContext,
  storageStatePath: string,
): Promise<void> {
  ensureStorageStateDir(storageStatePath);
  await context.storageState({ path: storageStatePath });
}
