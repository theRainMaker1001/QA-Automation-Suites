// @critical smoke to detect 'site is down' vs 'server 5xx' vs 'UI broken'

import { test, expect } from '@playwright/test';

test.describe('@bank @critical availability', () => {
  test('@critical server responds to GET / (no DNS/connection error)', async ({ request }) => {
    try {
      const res = await request.get('/');
      expect(res.status(), 'SERVER_5XX').toBeLessThan(500); // 5xx => fail as server-side outage
    } catch (e) {
      // Network/DNS/outage: give a clear failure code
      test.fail(true, 'NETWORK_DOWN');
      throw e;
    }
  });

  test('@critical homepage renders login UI', async ({ page }) => {
    await page.goto('/'); // baseURL from e2e/.env or CI
    await expect(page.getByText(/Customer Login/i), 'APP_BROKEN_UI').toBeVisible();
  });
});
