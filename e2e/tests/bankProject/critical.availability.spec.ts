// @critical smoke to detect 'site is down' vs 'server 5xx' vs 'UI broken'

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page.js';

test.describe('@bank @critical availability', () => {
  test('@critical server responds to GET / (no DNS/connection error)', async ({ request }) => {
    try {
      const res = await request.get('/');
      expect(res.status(), 'SERVER_5XX').toBeLessThan(500); // 5xx => fail as server-side outage
    } catch (e) {
      // Network/DNS/outage: fail hard with explicit code
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(`NETWORK_DOWN: ${message}`);
    }
  });

  test('@critical homepage renders login UI', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.expectLoginFormVisible();
  });
});
