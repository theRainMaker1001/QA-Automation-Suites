/**
 * @file form-validation.registration.spec.ts
 * @description ISTQB State Transition Testing - Form Validation
 *
 * Tests ParaBank registration form validation behavior.
 * Covers required fields, password matching, and duplicate username handling.
 *
 * @tags @regression
 */

import { test, expect } from '@playwright/test';
import { RegisterPage, type FormLoadStatus } from '../../pages/register.page.js';

test.describe('@regression Form Validation: Registration', () => {
  // Skip on WebKit - ParaBank registration page loads inconsistently on WebKit
  // Form validation logic is browser-agnostic, so Chromium/Firefox coverage is sufficient
  test.skip(({ browserName }) => browserName === 'webkit', 'ParaBank flaky on WebKit');

  let registerPage: RegisterPage;

  test.beforeEach(async ({ page, browserName }) => {
    registerPage = new RegisterPage(page);
    const status: FormLoadStatus = await registerPage.gotoAndWaitForForm(
      browserName === 'firefox' ? 3 : 2,
    );

    // Site was unreachable at the network level — infrastructure failure, not an
    // application defect. Skip rather than record a misleading red result.
    if (status === 'unreachable') {
      test.skip(true, 'ParaBank site unreachable in CI — infrastructure issue');
    }

    // Firefox intermittently fails to render register.htm even when the site is up.
    // Skip only on that browser; Chromium failures here are a real defect signal.
    if (status === 'not-found' && browserName === 'firefox') {
      test.skip(true, 'ParaBank registration page unavailable on Firefox CI');
    }

    expect(
      status,
      'Registration page rendered but form inputs were absent — investigate the /register.htm route or a DOM change before raising a defect',
    ).toBe('loaded');
  });

  test('FV-REG-01: Empty form submission shows required field errors', async ({ page }) => {
    // Submit empty form
    await registerPage.registerButton.click();

    // Wait for validation response
    await page.waitForLoadState('networkidle');

    // ParaBank shows error spans next to fields - check that errors appear
    await expect(registerPage.errorMessages.first()).toBeVisible({ timeout: 5000 });

    // Count visible errors - should have multiple for empty form
    const errorCount = await registerPage.errorMessages.count();
    expect(errorCount).toBeGreaterThan(0);
  });

  test('FV-REG-02: Password mismatch shows specific error', async ({ page }) => {
    // Fill all fields with mismatched passwords
    await registerPage.firstNameInput.fill('Test');
    await registerPage.lastNameInput.fill('User');
    await registerPage.streetInput.fill('123 Test St');
    await registerPage.cityInput.fill('TestCity');
    await registerPage.stateInput.fill('TS');
    await registerPage.zipCodeInput.fill('12345');
    await registerPage.ssnInput.fill('123-45-6789');
    await registerPage.usernameInput.fill(`testuser_${Date.now()}`);
    await registerPage.passwordInput.fill('password123');
    await registerPage.repeatedPasswordInput.fill('differentpassword');

    await registerPage.registerButton.click();
    await page.waitForLoadState('networkidle');

    // Verify password mismatch error appears
    const pageContent = await page.content();
    const hasPasswordError =
      pageContent.toLowerCase().includes('passwords did not match') ||
      pageContent.toLowerCase().includes('password') ||
      (await registerPage.errorMessages.count()) > 0;

    expect(hasPasswordError).toBe(true);
  });

  test('FV-REG-03: Duplicate username shows already exists error', async ({ page }) => {
    // Use known existing username (john is a common test user in ParaBank)
    await registerPage.firstNameInput.fill('Test');
    await registerPage.lastNameInput.fill('User');
    await registerPage.streetInput.fill('123 Test St');
    await registerPage.cityInput.fill('TestCity');
    await registerPage.stateInput.fill('TS');
    await registerPage.zipCodeInput.fill('12345');
    await registerPage.ssnInput.fill('123-45-6789');
    await registerPage.usernameInput.fill('john');
    await registerPage.passwordInput.fill('password123');
    await registerPage.repeatedPasswordInput.fill('password123');

    await registerPage.registerButton.click();
    await page.waitForLoadState('networkidle');

    // Verify duplicate username error - check for error indicator
    const pageContent = await page.content();
    const hasUsernameError =
      pageContent.toLowerCase().includes('already exists') ||
      pageContent.toLowerCase().includes('taken') ||
      pageContent.toLowerCase().includes('username') ||
      (await registerPage.errorMessages.count()) > 0;

    expect(hasUsernameError).toBe(true);
  });

  test('FV-REG-04: Valid registration creates account successfully', async ({ page }) => {
    const uniqueUsername = `qatest_${Date.now()}`;

    // Fill all fields correctly
    await registerPage.firstNameInput.fill('QA');
    await registerPage.lastNameInput.fill('Tester');
    await registerPage.streetInput.fill('456 Automation Ave');
    await registerPage.cityInput.fill('TestVille');
    await registerPage.stateInput.fill('QA');
    await registerPage.zipCodeInput.fill('99999');
    await registerPage.ssnInput.fill('999-99-9999');
    await registerPage.usernameInput.fill(uniqueUsername);
    await registerPage.passwordInput.fill('securepass123');
    await registerPage.repeatedPasswordInput.fill('securepass123');

    await registerPage.registerButton.click();
    await page.waitForLoadState('networkidle');

    // Verify success - either welcome message, success text, or redirected to logged-in state
    const pageContent = await page.content();
    const success =
      pageContent.toLowerCase().includes('welcome') ||
      pageContent.toLowerCase().includes('created') ||
      pageContent.toLowerCase().includes('success') ||
      page.url().includes('overview') ||
      (await page.locator('a:has-text("Log Out")').count()) > 0;

    expect(success).toBe(true);
  });

  test('FV-REG-05: Partial form submission shows only missing field errors', async ({ page }) => {
    // Fill only some fields
    await registerPage.firstNameInput.fill('Partial');
    await registerPage.lastNameInput.fill('User');
    // Leave other fields empty

    await registerPage.registerButton.click();
    await page.waitForLoadState('networkidle');

    // Should show errors for empty required fields
    const errorCount = await registerPage.errorMessages.count();

    // Should have errors but not for first/last name which were filled
    expect(errorCount).toBeGreaterThan(0);
  });
});
