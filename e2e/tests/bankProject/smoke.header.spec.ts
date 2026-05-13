// e2e/tests/bank/smoke.header.spec.ts
import { test } from '@playwright/test';
import { LoginPage } from '../../pages/login.page.js';

test('@bank @smoke homepage shows login box', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.expectGuestLoginSurface();
});
