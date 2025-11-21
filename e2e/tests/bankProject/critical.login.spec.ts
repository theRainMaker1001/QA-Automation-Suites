// @critical smoke for the core log in flow (elements only, no real creds as yet)

import { test, expect } from '@playwright/test';

test.describe('@bank @critical login-surface', () => {
  test('@critical login form is reachable and interactive', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel(/Username/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
  });
});
