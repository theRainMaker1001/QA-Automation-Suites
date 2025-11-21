import { test, expect } from '@playwright/test';

const BASE = process.env.BANK_BASE_URL ?? 'https://parabank.parasoft.com/parabank';

test.describe('@bank @critical login-surface', () => {
  test('@critical login form is reachable and interactive', async ({ page }) => {
    await page.goto(BASE + '/');

    // Scope to the login panel (ParaBank uses #leftPanel containing #loginPanel)
    const panel = page.locator('#loginPanel, #leftPanel');

    // Guard: panel renders and says 'Customer Login'
    await expect(panel.getByText(/Customer Login/i)).toBeVisible();

    // Robust input fields (attribute fallbacks)
    const username = panel
      .locator('input[name="username"], input#username, input[placeholder*="user" i]')
      .first();
    const password = panel
      .locator('input[name="password"], input#password, input[placeholder*="pass" i]')
      .first();

    // Use ARIA role (maps input[type=submit] to role=button) – allows regex

    const submit = panel.getByRole('button', { name: /log\s*in/i });

    await expect(username, 'username field missing').toBeVisible();
    await expect(password, 'password field missing').toBeVisible();
    await expect(submit, 'login submit missing').toBeVisible();
  });
});
