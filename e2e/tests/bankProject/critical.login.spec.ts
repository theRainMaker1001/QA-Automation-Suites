import { test } from '@playwright/test';
import { LoginPage } from '../../pages/login.page.js';

test.describe('@bank @critical login-surface', () => {
  test('@critical login form is reachable and interactive', async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.expectGuestLoginSurface({
      testInfo,
      diagnosticsReason: 'critical login-surface check expected guest login state',
    });
  });
});
