import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page.js';

test.describe('@bank @critical login-surface', () => {
  test('@critical login form is reachable and interactive', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.expectLoginFormVisible();
    expect(await loginPage.getCurrentState()).toBe('GUEST');
  });
});
