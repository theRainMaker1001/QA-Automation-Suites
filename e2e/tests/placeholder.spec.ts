import { test, expect } from '@playwright/test';

test('placeholder', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/example domain/i);
});
